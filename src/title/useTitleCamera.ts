import { useCallback } from "react"
import { Vector3 } from "three"
import { placedClock } from "@/clock/placedClock"
import type { Pose } from "@/passage/passage"
import { startPlaying, title, titleClock } from "./title"
import { titleSettings } from "./titleSettings"
import { openingPose, titleViewPose } from "./titleView"
import { useTitleTuning } from "./useTitleTuning"

const clockPosition = new Vector3()

export function useTitleCamera() {
  useTitleTuning()

  return useCallback((spawn: Pose): Pose | null => {
    if (title.stage === "playing") return null
    const clock = placedClock.object
    const view = clock
      ? titleViewPose(clock.getWorldPosition(clockPosition), spawn, titleSettings)
      : spawn
    if (title.stage !== "opening") return view
    const progress = (titleClock() - title.openedAt) / titleSettings.glideSeconds
    if (progress < 1) return openingPose(view, spawn, progress)
    startPlaying()
    return null
  }, [])
}
