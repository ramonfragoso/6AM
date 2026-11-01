import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

export function useChromaticAberrationTuning() {
  return useTuningControls(
    "Chromatic Aberration",
    {
      enabled: true,
      strength: slider(0.3, 0, 3, 0.01, "How far red and blue split apart"),
      scale: slider(
        1.1,
        0,
        3,
        0.01,
        "How much the split is a plain size difference between colors; the rest grows toward the edges",
      ),
    },
    { collapsed: true },
  )
}
