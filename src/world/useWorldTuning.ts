import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

export function useWorldTuning() {
  const lighting = useTuningControls(
    "Lighting",
    { ambientIntensity: slider(4, 0, 20, 0.1) },
    { collapsed: true },
  )
  return { lighting }
}
