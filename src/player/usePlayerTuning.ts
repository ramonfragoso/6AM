import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

export function usePlayerTuning() {
  return useTuningControls(
    "Player",
    {
      walkSpeed: slider(4, 0.5, 15, 0.1, "Meters per second at full tilt"),
      eyeHeight: slider(1.5, 0.2, 2, 0.01, "Camera height above the Player's feet, in meters"),
      capsuleRadius: slider(
        0.3,
        0.1,
        0.6,
        0.01,
        "Thickness of the Player's body in meters; its height stays the same",
      ),
      stickLookSpeed: slider(
        3,
        0.5,
        10,
        0.1,
        "Radians per second with the right stick fully tilted",
      ),
      mouseSensitivity: slider(0.002, 0.0005, 0.01, 0.0001, "Radians per pixel of mouse movement"),
    },
    { collapsed: true },
  )
}
