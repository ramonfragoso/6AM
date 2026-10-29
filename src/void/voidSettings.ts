import type { SoundName } from "@/sound/sounds"

export const CREAKS = ["woodCreak", "woodCreak2", "woodCreak3"] as const satisfies SoundName[]

export type Creak = (typeof CREAKS)[number]

export const voidSettings = {
  triggerDistance: 4,
  delay: 0.6,
  openSeconds: 3.5,
  angle: 75,
  shadowUpdates: 2,
  crossingSeconds: 2,
  fallSeconds: 1,
  fadeOut: 1.5,
  blackSeconds: 0.5,
  fadeIn: 1.5,
}
