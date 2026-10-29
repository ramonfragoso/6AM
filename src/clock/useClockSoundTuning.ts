import { useMemo } from "react"
import {
  emitterSliders,
  muffleSlider,
  pitchSlider,
  pitchVariationSlider,
  volumeSlider,
} from "@/sound/soundSliders"
import { useTuningControls } from "@/tuning/useTuningControls"

export type ClockSoundSettings = {
  volume: number
  tick: number
  tickPitch: number
  tock: number
  tockPitch: number
  pitchVariation: number
  glitch: number
  glitchPitch: number
  glitchSteps: number
  ring: number
  ringPitch: number
  muffle: number
  distance: number
  rolloff: number
  maxDistance: number
}

const CLOCK_EMITTER = { refDistance: 1, rolloff: 1.5, maxDistance: 10 }

export function useClockSoundTuning() {
  const values = useTuningControls(
    "Sound.Clock",
    {
      volume: volumeSlider(1, "Loudness of every Clock sound"),
      tick: volumeSlider(1, "Loudness of the tick (even seconds)"),
      tickPitch: pitchSlider(0, "Pitch of the tick"),
      tock: volumeSlider(0.8, "Loudness of the tock (odd seconds), the same sound tuned apart"),
      tockPitch: pitchSlider(-3, "Pitch of the tock; lower than the tick sounds like tick-tock"),
      pitchVariation: pitchVariationSlider(
        0.15,
        "Random pitch change on every tick and tock, so they do not sound machine-copied",
      ),
      glitch: volumeSlider(1, "Loudness of the Glitch's buzz"),
      glitchPitch: pitchSlider(0, "Pitch of the Glitch's buzz"),
      glitchSteps: volumeSlider(
        0.5,
        "Loudness of the fast ticks while the Hands jump back and forth in the Glitch",
      ),
      ring: volumeSlider(1, "Loudness of the alarm bell when the hour moves"),
      ringPitch: pitchSlider(0, "Pitch of the alarm bell"),
      muffle: muffleSlider(0, "Muffles every Clock sound"),
      ...emitterSliders(CLOCK_EMITTER),
    },
    { collapsed: true },
  )
  return useMemo<ClockSoundSettings>(() => ({ ...values }), [values])
}
