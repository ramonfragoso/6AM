import { Color, type Material } from "three"
import { float, materialColor, mix, uniform } from "three/tsl"
import type { MeshStandardNodeMaterial } from "three/webgpu"
import type { PiecePart } from "@/kit/useKit"
import type { SurfaceOverrides } from "@/kit/kitSurface"

export const HAND_LOOK = {
  color: "#050505",
  roughness: 0.5,
  metalness: 0,
}

export const DIAL_GLOW = {
  color: "#fff4dc",
  glow: 0,
  printed: 1,
}

export const clockHandSurface = {
  color: uniform(new Color(HAND_LOOK.color)),
  roughness: uniform(HAND_LOOK.roughness),
  metalness: uniform(HAND_LOOK.metalness),
}

export const clockDialGlow = {
  color: uniform(new Color(DIAL_GLOW.color)),
  glow: uniform(DIAL_GLOW.glow),
  printed: uniform(DIAL_GLOW.printed),
}

const HAND_MATERIAL_PREFIX = "kit_clock_body__clock_hand_"

const DIAL_MATERIAL_PREFIX = "kit_clock_dial__"

export function clockSurfaceOverrides(source: Material): SurfaceOverrides | null {
  if (!source.name.startsWith(HAND_MATERIAL_PREFIX)) return null
  return {
    color: clockHandSurface.color.rgb,
    roughness: clockHandSurface.roughness,
    metalness: clockHandSurface.metalness,
  }
}

export function lightUpDial(parts: PiecePart[]) {
  for (const { material, source } of parts) {
    if (!source.name.startsWith(DIAL_MATERIAL_PREFIX)) continue
    const print = mix(float(1), materialColor.xyz, clockDialGlow.printed)
    ;(material as MeshStandardNodeMaterial).emissiveNode = clockDialGlow.color
      .mul(clockDialGlow.glow)
      .mul(print)
  }
}
