import { useTuningControls } from "@/tuning/useTuningControls"
import { IN_DEVELOPMENT } from "./development"

export function useDebugMode() {
  const { enabled } = useTuningControls("Debug", { enabled: false })
  return IN_DEVELOPMENT && enabled
}
