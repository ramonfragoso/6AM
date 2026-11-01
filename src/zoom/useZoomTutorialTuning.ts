import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

export function useZoomTutorialTuning() {
  return useTuningControls(
    "Zoom Tutorial",
    {
      fade: slider(0.4, 0.05, 2, 0.01, "Seconds the Zoom Tutorial takes to fade in or out"),
      linger: slider(
        0.8,
        0,
        3,
        0.05,
        "Seconds the filled circle stays after a full Zoom before the Zoom Tutorial fades out",
      ),
    },
    { collapsed: true },
  )
}
