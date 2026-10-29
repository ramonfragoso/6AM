import { useCallback, useEffect } from "react"
import { toneOf } from "@/sound/soundSliders"
import { playStretched, preloadStretchedSound } from "@/sound/stretchedSound"
import type { PassageTiming } from "./passage"
import { useDoorSoundTuning } from "./useDoorSoundTuning"

export type DoorSounding = { doorSounded: boolean }

const SHORTEST_SHARE = 0.05

export function useDoorSound() {
  const { volume, keepPitch, muffle, end } = useDoorSoundTuning()

  useEffect(() => preloadStretchedSound("doorOpening"), [])

  return useCallback(
    (passage: DoorSounding, progress: number, duration: number, timing: PassageTiming) => {
      const opening = openingShare(timing)
      if (passage.doorSounded || progress < opening) return
      passage.doorSounded = true
      playStretched("doorOpening", {
        seconds: Math.max(end - opening, SHORTEST_SHARE) * duration,
        volume,
        tone: toneOf(muffle),
        keepPitch,
      })
    },
    [volume, keepPitch, muffle, end],
  )
}

function openingShare({ lineUpEnd, openStart }: PassageTiming) {
  return Math.max(lineUpEnd, openStart)
}
