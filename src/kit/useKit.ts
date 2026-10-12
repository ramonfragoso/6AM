import { useEffect, useMemo, useRef } from "react"
import {
  Box3,
  type BufferGeometry,
  type Material,
  Matrix4,
  Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from "three"
import { disposeMaterial, releaseModel, useModel } from "@/models/useModel"
import { KIT_NODE_PREFIX, KIT_PIECES, type KitPiece } from "./kitPieces"
import { kitSurfaceMaterial } from "./kitSurface"

export type PiecePart = {
  geometry: BufferGeometry
  material: Material
  matrix: Matrix4
  canvas: boolean
}

export type PieceAnchor = { name: string; matrix: Matrix4 }

export type PieceModel = {
  parts: PiecePart[]
  bounds: Box3
  anchors: PieceAnchor[]
}

export type Kit = Record<KitPiece, PieceModel>

type LoadedKit = { url: string; scene: Object3D; kit: Kit }

const CANVAS_MATERIAL_PREFIX = "kit_painting_canvas"

const ANCHOR_SEPARATOR = "__"

const ANCHOR_PREFIX = "anchor_"

export function useKit(url: string): Kit {
  const { scene } = useModel(url)
  const kit = useMemo(() => pieceModelsOf(scene), [scene])
  useReleaseReplacedKit({ url, scene, kit })
  return kit
}

function useReleaseReplacedKit(loaded: LoadedKit) {
  const current = useRef<LoadedKit | null>(null)

  useEffect(() => {
    const previous = current.current
    current.current = loaded
    if (!previous || previous.url === loaded.url) return
    releaseModel(previous.url, previous.scene)
    surfaceMaterialsOf(previous.kit).forEach(disposeMaterial)
  }, [loaded])
}

function surfaceMaterialsOf(kit: Kit) {
  return new Set(Object.values(kit).flatMap((piece) => piece.parts.map((part) => part.material)))
}

function pieceModelsOf(scene: Object3D): Kit {
  scene.updateMatrixWorld(true)
  const surfaces = new Map<Material, Material>()
  const entries = KIT_PIECES.map((piece) => [piece, pieceModelOf(scene, piece, surfaces)] as const)
  return Object.fromEntries(entries) as Kit
}

function pieceModelOf(
  scene: Object3D,
  piece: KitPiece,
  surfaces: Map<Material, Material>,
): PieceModel {
  const root = scene.getObjectByName(KIT_NODE_PREFIX + piece)
  if (!root) {
    // eslint-disable-next-line no-console
    console.warn(`Kit has no "${KIT_NODE_PREFIX + piece}" node; export the Kit again from Blender`)
    return { parts: [], bounds: new Box3(), anchors: [] }
  }

  const toRoot = root.matrixWorld.clone().invert()
  const parts: PiecePart[] = []
  const bounds = new Box3()
  const anchors: PieceAnchor[] = []
  root.traverse((object) => {
    const anchorAt = object.name.indexOf(ANCHOR_SEPARATOR + ANCHOR_PREFIX)
    if (anchorAt >= 0) {
      const name = object.name.slice(anchorAt + ANCHOR_SEPARATOR.length)
      anchors.push({ name, matrix: toRoot.clone().multiply(object.matrixWorld) })
    }
    if (!(object instanceof Mesh)) return
    const matrix = toRoot.clone().multiply(object.matrixWorld)
    parts.push({
      geometry: object.geometry,
      material: surfaceOf(object.material, surfaces),
      matrix,
      canvas: (object.material as Material).name.startsWith(CANVAS_MATERIAL_PREFIX),
    })
    object.geometry.computeBoundingBox()
    bounds.union(object.geometry.boundingBox!.clone().applyMatrix4(matrix))
  })
  return { parts, bounds, anchors }
}

function surfaceOf(material: Material, surfaces: Map<Material, Material>) {
  let surface = surfaces.get(material)
  if (!surface) {
    surface = kitSurfaceMaterial(material as MeshStandardMaterial)
    surfaces.set(material, surface)
  }
  return surface
}
