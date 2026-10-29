import { MathUtils } from "three"
import { playSound } from "./playSound"
import { randomSpread } from "./shaping"
import type { SoundEmitter } from "./soundEmitter"
import { toneOf } from "./soundSliders"
import type { SoundName } from "./sounds"

export type SoundVariation = {
  volume: number
  volumeVariation: number
  pitch: number
  pitchVariation: number
  muffle: number
  muffleVariation: number
  lengthVariation: number
  timingVariation: number
}

export function playVaried(
  name: SoundName,
  variation: SoundVariation,
  volume = 1,
  from: SoundEmitter | null = null,
) {
  const muffle = MathUtils.clamp(variation.muffle + randomSpread(variation.muffleVariation), 0, 1)
  return playSound(name, {
    from,
    volume: volume * variation.volume * Math.max(0, 1 + randomSpread(variation.volumeVariation)),
    pitch: variation.pitch + randomSpread(variation.pitchVariation),
    tone: toneOf(muffle),
    delay: Math.random() * variation.timingVariation,
    playedShare: 1 - Math.random() * variation.lengthVariation,
  })
}
