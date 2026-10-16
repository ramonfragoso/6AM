import { type Material, Matrix4, type MeshStandardMaterial, type Vector3Tuple } from "three"
import type { WallSide } from "@/kit/corridorLayout"
import type { Placement } from "@/kit/kitPieces"
import type { Kit } from "@/kit/useKit"
import type { SurfaceTextures, TexturesFor } from "@/models/useSurfacedModel"

export const DOOR_WALL_URL = "/models/wall_4m_door.glb"

export const DOOR_WALL_NODE = "kit_wall_4m_door"

export const DOOR_LEAF_NODE = "kit_door_leaf"

export const DOOR_WALL_INDEX = 1

export const DOOR_WALL_SIDE: WallSide = "right"

const DOOR_ALONG_WALL = 2

const DOOR_TURN = Math.PI

const LEAF_HINGE: Vector3Tuple = [0.7303, 0, 0.1089]

const LEAF_THICKNESS = 0.2201

const FRONT_HINGE_OFFSET = new Matrix4().makeTranslation(0, 0, -LEAF_THICKNESS)

const BACK_FROM_FRONT_HINGE = new Matrix4().makeTranslation(0, 0, LEAF_THICKNESS)

const BACK_HINGE = new Matrix4().makeTranslation(...LEAF_HINGE)

const FRONT_HINGE = BACK_HINGE.clone().multiply(FRONT_HINGE_OFFSET)

const leafTurn = new Matrix4()

const DEGREES = Math.PI / 180

const PLASTER_MATERIAL_PREFIX = "kit_painted_plaster_wall__"

const MATERIAL_SLUG_END = "__"

const UNIQUE_MATERIAL_SUFFIX = "__unique"

const SAME_SPOT = 1e-4

export function doorFrameInWall({ position: [x, y, z], rotationY }: Placement): Placement {
  return {
    piece: "door_frame",
    position: [
      x + DOOR_ALONG_WALL * Math.cos(rotationY),
      y,
      z - DOOR_ALONG_WALL * Math.sin(rotationY),
    ],
    rotationY: rotationY + DOOR_TURN,
  }
}

export function doorLeafMatrix(frame: Matrix4, openDegrees: number, target = new Matrix4()) {
  leafTurn.makeRotationY(openDegrees * DEGREES)
  if (openDegrees >= 0) return target.copy(frame).multiply(BACK_HINGE).multiply(leafTurn)
  return target.copy(frame).multiply(FRONT_HINGE).multiply(leafTurn).multiply(BACK_FROM_FRONT_HINGE)
}

export function framePartsOf(kit: Kit) {
  return kit.door_frame.parts.filter(
    (part) => !part.material.name.startsWith(PLASTER_MATERIAL_PREFIX),
  )
}

export function kitTexturesOf(kit: Kit): TexturesFor {
  const bySlug = new Map<string, SurfaceTextures[]>()
  for (const piece of Object.values(kit)) {
    for (const { material } of piece.parts) {
      const slug = repeatingSlugOf(material)
      if (!slug) continue
      const textures = texturesOf(material as MeshStandardMaterial)
      const known = bySlug.get(slug) ?? []
      if (!known.some(({ map }) => map === textures.map)) bySlug.set(slug, [...known, textures])
    }
  }
  return (material) => {
    const slug = repeatingSlugOf(material)
    const known = slug ? bySlug.get(slug) : undefined
    return known?.length === 1 ? known[0] : undefined
  }
}

function repeatingSlugOf({ name }: Material) {
  if (name.endsWith(UNIQUE_MATERIAL_SUFFIX)) return undefined
  const end = name.indexOf(MATERIAL_SLUG_END)
  return end < 0 ? undefined : name.slice(0, end)
}

function texturesOf({ map, normalMap, roughnessMap, metalnessMap }: MeshStandardMaterial) {
  return {
    map,
    normalMap,
    roughnessMap,
    metalnessMap,
  }
}

export function withoutPlacement(placements: Placement[], removed: Placement): Placement[] {
  const kept = placements.filter((placement) => !samePlacement(placement, removed))
  if (kept.length !== placements.length - 1) {
    throw new Error(`The House has no "${removed.piece}" to replace with the Door Wall`)
  }
  return kept
}

function samePlacement(a: Placement, b: Placement) {
  return (
    a.piece === b.piece &&
    Math.abs(a.rotationY - b.rotationY) < SAME_SPOT &&
    a.position.every((value, axis) => Math.abs(value - b.position[axis]) < SAME_SPOT)
  )
}
