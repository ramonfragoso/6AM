import { bufferOf } from "@/sound/audioEngine"
import { startSound } from "@/sound/playSound"
import { randomSpread, rateOf, semitonesOf } from "@/sound/shaping"
import { toneOf } from "@/sound/soundSliders"
import type { ZoomTurn } from "./zoom"

export type ZoomSoundSettings = {
  volume: number
  muffle: number
  outPitch: number
  outPitchVariation: number
}

export function playZoomSound(
  { direction, seconds }: ZoomTurn,
  duration: number,
  settings: ZoomSoundSettings,
) {
  const buffer = bufferOf("zoom")
  if (!buffer) return null
  const fitted = semitonesOf(buffer.duration / duration)
  const pitch = direction === "in" ? fitted : fitted + outPitchOf(settings)
  const rate = rateOf(pitch)
  const skipped = Math.max(buffer.duration - seconds * rate, 0)
  return startSound("zoom", {
    volume: settings.volume,
    pitch,
    tone: toneOf(settings.muffle),
    delay: -skipped / rate,
  })
}

function outPitchOf({ outPitch, outPitchVariation }: ZoomSoundSettings) {
  return outPitch + randomSpread(outPitchVariation)
}
