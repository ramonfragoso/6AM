import { Color, DoubleSide, FrontSide, type Material, type MeshStandardMaterial } from "three"
import { materialColor, uniform } from "three/tsl"
import { MeshStandardNodeMaterial } from "three/webgpu"

export const ghostLook = {
  opacity: uniform(0.85),
  fade: uniform(1),
  color: uniform(new Color("#a9d6d3")),
  glow: uniform(0.15),
  roughness: uniform(0.6),
  eyeColor: uniform(new Color("#ffffff")),
  eyeGlow: uniform(3),
  decalGlow: uniform(0.8),
}

export const BODY_RENDER_ORDER = 1

export const DECAL_RENDER_ORDER = 2

const EYES_MATERIAL = "ghost_eyes"

const DECAL_MARKER = "ghost_decal_"

const shown = ghostLook.opacity.mul(ghostLook.fade)

export function isDecal(material: Material) {
  return material.name.startsWith(DECAL_MARKER)
}

export function ghostSurface(loaded: MeshStandardMaterial) {
  const surface = new MeshStandardNodeMaterial({ transparent: true, name: loaded.name })
  surface.roughnessNode = ghostLook.roughness
  surface.opacityNode = shown
  if (isDecal(loaded)) {
    surface.map = loaded.map
    surface.side = DoubleSide
    surface.depthWrite = false
    surface.emissiveNode = materialColor.rgb.mul(ghostLook.decalGlow)
    return surface
  }
  const [color, glow] =
    loaded.name === EYES_MATERIAL
      ? [ghostLook.eyeColor, ghostLook.eyeGlow]
      : [ghostLook.color, ghostLook.glow]
  surface.colorNode = color
  surface.emissiveNode = color.mul(glow)
  surface.side = FrontSide
  return surface
}
