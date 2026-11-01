import { uniform, vec2 } from "three/tsl"

const SCALE_SPREAD = 0.02

const DISTANCE_SPREAD = 0.01

const LENS_CENTER = vec2(0.5, 0.5)

export const RED_OUTWARD = 1

export const BLUE_INWARD = -1

export type ChromaticAberration = ReturnType<typeof createChromaticAberration>

export function createChromaticAberration() {
  return {
    strength: uniform(0),
    scale: uniform(1),
  }
}

export function channelUV(uv: any, aberration: ChromaticAberration, direction: number) {
  const offset = uv.sub(LENS_CENTER)
  const spread = aberration.scale
    .mul(SCALE_SPREAD)
    .add(offset.length().mul(DISTANCE_SPREAD))
    .mul(aberration.strength)
    .mul(direction)
  return LENS_CENTER.add(offset.mul(spread.add(1)))
}
