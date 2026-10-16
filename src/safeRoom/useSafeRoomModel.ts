import { useMemo } from "react"
import { Color, type MeshStandardMaterial } from "three"
import { uniform } from "three/tsl"
import type { MeshStandardNodeMaterial } from "three/webgpu"
import type { SurfaceOptions } from "@/kit/kitSurface"
import { type PieceModel, pieceModelsOf } from "@/kit/useKit"
import { useModel } from "@/models/useModel"
import type { TexturesFor } from "@/models/useSurfacedModel"
import { shadeFromLamp } from "./lampShadow"
import { EXTERIOR_PIECES, ROOM_PIECES, SAFE_ROOM_URL } from "./safeRooms"

export const safeRoomSurface = { occlusion: uniform(1), grime: uniform(0.3) }

export const ROOM_SURFACE: SurfaceOptions = {
  worldVariation: false,
  occlusionStrength: safeRoomSurface.occlusion,
  grimeStrength: safeRoomSurface.grime,
}

export const ceilingLampGlow = uniform(new Color())

const GLOW_MATERIAL_SUFFIX = "__glow"

export function useSafeRoomModel(texturesFor: TexturesFor) {
  const { scene } = useModel(SAFE_ROOM_URL)
  return useMemo(() => {
    const room = pieceModelsOf(scene, ROOM_PIECES, ROOM_SURFACE)
    lightUpGlowParts(room.ceiling_lamp)
    for (const piece of Object.values(room)) shadePartsFromLamp(piece)
    return { room, exterior: pieceModelsOf(scene, EXTERIOR_PIECES, { texturesFor }) }
  }, [scene, texturesFor])
}

function shadePartsFromLamp({ parts }: PieceModel) {
  for (const { material, source } of parts) {
    shadeFromLamp(material, (source as MeshStandardMaterial).aoMap)
  }
}

function lightUpGlowParts({ parts }: PieceModel) {
  for (const { material } of parts) {
    if (!material.name.endsWith(GLOW_MATERIAL_SUFFIX)) continue
    ;(material as MeshStandardNodeMaterial).emissiveNode = ceilingLampGlow
  }
}
