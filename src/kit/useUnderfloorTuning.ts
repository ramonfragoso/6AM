import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

export function useUnderfloorTuning() {
  return useTuningControls(
    "Underfloor",
    { depth: slider(0.05, 0, 1, 0.01, "How far below the Floor the dark plane lies, in meters") },
    { collapsed: true },
  )
}
