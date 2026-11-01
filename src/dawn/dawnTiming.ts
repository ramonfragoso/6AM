import { type CreditsTiming, ENDING_MUSIC_CUES } from "./credits"

export type DawnTiming = CreditsTiming & { fadeOut: number; fadeIn: number }

export const dawnTiming: DawnTiming = {
  fadeOut: 3,
  fadeIn: 2,
  musicDelay: 4,
  musicFadeIn: 3,
  settle: 6,
  rollStart: ENDING_MUSIC_CUES.secondHeavy,
  rollCentered: ENDING_MUSIC_CUES.lastClean,
  buttonDelay: 0.5,
}
