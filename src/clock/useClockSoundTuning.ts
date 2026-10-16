import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

const STEP = 0.01

export type ClockSoundSettings = {
  volume: number
  tick: number
  glitch: number
  ring: number
  distance: number
  rolloff: number
  maxDistance: number
}

export function useClockSoundTuning() {
  const values = useTuningControls(
    "Clock.Sound",
    {
      volume: slider(1, 0, 2, STEP, "Loudness of every Clock sound"),
      tick: slider(
        0.6,
        0,
        2,
        STEP,
        "Tick-tock while it counts, and the clunk when the minute jumps",
      ),
      glitch: slider(
        1,
        0,
        2,
        STEP,
        "The Glitch: its buzz, the fast steps and the snap back to zero",
      ),
      ring: slider(1, 0, 2, STEP, "The alarm bell when the hour moves"),
      distance: slider(1, 0.1, 5, STEP, "Meters within which the Clock is at full loudness"),
      rolloff: slider(1.5, 0, 5, STEP, "How fast it fades past that distance"),
      maxDistance: slider(10, 1, 50, STEP, "Meters past which it stops fading"),
    },
    { collapsed: true },
  )
  return useMemo<ClockSoundSettings>(() => ({ ...values }), [values])
}
