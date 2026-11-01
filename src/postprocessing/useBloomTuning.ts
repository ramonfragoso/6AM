import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

export function useBloomTuning() {
  return useTuningControls(
    "Bloom",
    {
      enabled: true,
      strength: slider(0.4, 0, 3, 0.01, "How bright the glow is"),
      radius: slider(0.4, 0, 1, 0.01, "How far the glow spreads"),
      threshold: slider(
        0.9,
        0,
        4,
        0.01,
        "Brightness above which a pixel glows, before tone mapping (1 is white)",
      ),
      smoothWidth: slider(0.3, 0, 2, 0.01, "How gradually the glow fades in above the threshold"),
    },
    { collapsed: true },
  )
}
