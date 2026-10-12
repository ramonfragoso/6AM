import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

export const DEFAULT_FOV = 80

export function useCameraTuning() {
  return useTuningControls(
    "Camera",
    { fov: slider(DEFAULT_FOV, 30, 150, 1, "Vertical field of view in degrees") },
    { collapsed: true },
  )
}
