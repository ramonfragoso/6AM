import { useTuningControls } from "@/tuning/useTuningControls"

export function useDebugMode() {
  const { enabled } = useTuningControls("Debug", { enabled: false })
  return enabled
}
