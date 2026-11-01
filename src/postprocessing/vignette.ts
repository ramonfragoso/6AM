import { float, mix, smoothstep, uniform, vec2 } from "three/tsl"

const SCREEN_CENTER = vec2(0.5, 0.5)

export type Vignette = ReturnType<typeof createVignette>

export function createVignette() {
  return {
    strength: uniform(0),
    radius: uniform(0.5),
    softness: uniform(0.5),
    roundness: uniform(0),
    aspect: uniform(1),
  }
}

export function vignetteShade(uv: any, vignette: Vignette) {
  const shape = vec2(mix(float(1), vignette.aspect, vignette.roundness), 1)
  const fromCenter = uv.sub(SCREEN_CENTER).mul(2).mul(shape).length().div(shape.length())
  const edge = vignette.radius.add(vignette.softness)
  return float(1).sub(smoothstep(vignette.radius, edge, fromCenter).mul(vignette.strength))
}
