import type { WhitenessSettings } from "./dawnLight"

export type DawnLightSettings = WhitenessSettings & {
  passageSeconds: number
  intensity: number
  color: string
  glow: number
  back: number
  height: number
  aimOut: number
  aimHeight: number
  angle: number
  penumbra: number
  distance: number
  decay: number
}

export const dawnLightSettings: DawnLightSettings = {
  passageSeconds: 7,
  intensity: 60,
  color: "#fff4e0",
  glow: 4,
  back: 0.6,
  height: 1.3,
  aimOut: 4,
  aimHeight: 0.4,
  angle: 80,
  penumbra: 0.9,
  distance: 14,
  decay: 1.4,
  whiteFrom: 0.3,
  whiteTo: 1.2,
}
