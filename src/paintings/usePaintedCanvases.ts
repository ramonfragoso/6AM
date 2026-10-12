import { useEffect, useLayoutEffect, useMemo } from "react"
import { AdditiveBlending, type Material, Matrix4, Mesh } from "three"
import { MeshStandardNodeMaterial } from "three/webgpu"
import type { PaintingFrame } from "@/kit/kitPieces"
import { placementMatrix } from "@/kit/KitInstances"
import type { Kit, PiecePart } from "@/kit/useKit"
import type { HungPainting, PaintingName } from "./paintings"
import type { GlassSettings } from "./usePaintingsTuning"
import { type PaintingTextures, usePaintingTextures } from "./usePaintingTextures"

const GLASS_GAP = 0.0025

const GLASS_OFFSET = new Matrix4().makeTranslation(0, 0, GLASS_GAP)

type CanvasMaterials = ReturnType<typeof canvasMaterials>

type CanvasSlot = { canvas: PiecePart; painted: Mesh; pane: Mesh } | null

export function usePaintedCanvases(
  kit: Kit,
  hung: HungPainting[],
  version: string,
  glassSettings: GlassSettings,
) {
  const textures = usePaintingTextures(version)
  const glass = useGlassMaterial(glassSettings)
  const materials = useMemo(() => canvasMaterials(kit, textures), [kit, textures])
  const frames = useSlotFrames(hung)
  const slots = useMemo(() => canvasSlots(materials, frames, glass), [materials, frames, glass])

  useEffect(() => () => materials.dispose(), [materials])
  useLayoutEffect(() => paintSlots(slots, hung, materials), [slots, hung, materials])

  return useMemo(() => slots.flatMap((slot) => (slot ? [slot.painted, slot.pane] : [])), [slots])
}

function useSlotFrames(hung: HungPainting[]) {
  const key = hung.map((painting) => painting.frame).join(" ")
  return useMemo(() => key.split(" ").filter(Boolean) as PaintingFrame[], [key])
}

function canvasMaterials(kit: Kit, textures: PaintingTextures) {
  const made = new Map<string, Material>()
  return {
    materialFor(frame: PaintingFrame, painting: PaintingName, blank: Material) {
      const key = `${frame}:${painting}`
      let material = made.get(key)
      if (!material) {
        material = Object.assign(blank.clone(), { map: textures[painting] })
        made.set(key, material)
      }
      return material
    },
    canvasOf: (frame: PaintingFrame) => kit[frame].parts.find((part) => part.canvas),
    dispose: () => made.forEach((material) => material.dispose()),
  }
}

function canvasSlots(materials: CanvasMaterials, frames: PaintingFrame[], glass: Material) {
  return frames.map((frame): CanvasSlot => {
    const canvas = materials.canvasOf(frame)
    if (!canvas) return null
    return {
      canvas,
      painted: fixedMesh(new Mesh(canvas.geometry, canvas.material)),
      pane: fixedMesh(new Mesh(canvas.geometry, glass)),
    }
  })
}

function paintSlots(slots: CanvasSlot[], hung: HungPainting[], materials: CanvasMaterials) {
  slots.forEach((slot, index) => {
    if (!slot) return
    const { painting, frame, placement } = hung[index]
    const matrix = placementMatrix(placement).multiply(slot.canvas.matrix)
    slot.painted.material = materials.materialFor(frame, painting, slot.canvas.material)
    placed(slot.painted, matrix)
    placed(slot.pane, matrix.multiply(GLASS_OFFSET))
  })
}

function useGlassMaterial({ glassReflection, glassRoughness }: GlassSettings) {
  const material = useMemo(
    () =>
      new MeshStandardNodeMaterial({
        color: 0x000000,
        metalness: 0,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => {
    material.opacity = glassReflection
    material.roughness = glassRoughness
  }, [material, glassReflection, glassRoughness])
  return material
}

function fixedMesh(mesh: Mesh) {
  mesh.matrixAutoUpdate = false
  mesh.receiveShadow = true
  return mesh
}

function placed(mesh: Mesh, matrix: Matrix4) {
  mesh.matrix.copy(matrix)
  mesh.matrixWorldNeedsUpdate = true
}
