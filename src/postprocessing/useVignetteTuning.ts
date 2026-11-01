import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

export function useVignetteTuning() {
  return useTuningControls(
    "Vignette",
    {
      enabled: true,
      strength: slider(0.4, 0, 1, 0.01, "How dark the corners get: 1 is black"),
      radius: slider(
        0.45,
        0,
        1.5,
        0.01,
        "Where the darkening starts: 0 is the middle of the screen, 1 the corners",
      ),
      softness: slider(0.6, 0.01, 1.5, 0.01, "How gradually it darkens past the radius"),
      roundness: slider(0, 0, 1, 0.01, "0 follows the screen's shape (an oval), 1 is a circle"),
    },
    { collapsed: true },
  )
}
