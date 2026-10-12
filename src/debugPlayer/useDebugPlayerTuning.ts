import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

export function useDebugPlayerTuning() {
  return useTuningControls(
    "DebugPlayer",
    { flySpeed: slider(6, 0.5, 30, 0.1, "Meters per second at full tilt, in any direction") },
    { collapsed: true },
  )
}
