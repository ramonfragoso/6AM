import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import type { PassageTiming } from "./passage"

export const DEFAULT_THROUGH = 1.5

const COLLAPSED = { collapsed: true }

const FRACTION_STEP = 0.01

export function usePassageTuning() {
  const values = useTuningControls(
    "Passage",
    {
      duration: slider(1, 0.3, 6, 0.05, "Seconds for the whole walk through a door"),
      openAngle: slider(95, 60, 110, 1, "How far the door swings open, in degrees"),
      lineUp: slider(
        0.9,
        0.4,
        2,
        0.01,
        "Meters in front of the door where the camera lines up before going through",
      ),
      through: slider(
        DEFAULT_THROUGH,
        1.3,
        3,
        0.01,
        "Meters past the door where the walk ends, clear of the swinging door",
      ),
      curve: slider(0.15, 0, 0.4, 0.01, "Most the path bends sideways, away from the open door"),
      curveVariation: slider(
        0.4,
        0,
        1,
        0.01,
        "How differently each walk bends; 0 makes every walk the same",
      ),
    },
    COLLAPSED,
  )
  const timing = usePassageTiming()
  return useMemo(() => ({ ...values, timing }), [values, timing])
}

function usePassageTiming() {
  const values = useTuningControls(
    "Passage.Timing",
    {
      lineUpEnd: fraction(0.3, "When the camera has lined up with the door"),
      openStart: fraction(0.15, "When the door starts to open"),
      openEnd: fraction(0.55, "When the door is fully open"),
      throughStart: fraction(0.25, "When the camera starts through the doorway"),
      throughEnd: fraction(0.8, "When the camera stops past the door"),
      closeStart: fraction(0.65, "When the door starts to close; it shuts at the end"),
    },
    COLLAPSED,
  )
  return useMemo<PassageTiming>(() => ({ ...values }), [values])
}

function fraction(value: number, hint: string) {
  return slider(value, 0, 1, FRACTION_STEP, `${hint}, as a share of the duration`)
}
