import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import type { CameraMotionSettings } from "./cameraMotion"

export function useCameraMotionTuning() {
  const values = useTuningControls(
    "Camera.Motion",
    {
      intensity: slider(
        1,
        0,
        1,
        0.01,
        "Scales every Head Bob and Breathing movement and roll together; 0 keeps the camera perfectly still",
      ),
      stepsPerMeter: slider(
        1,
        0.3,
        3,
        0.01,
        "Steps per meter Walked: one dip of the Head Bob and one Step Sound each. It follows the distance, so walking slower steps slower",
      ),
      bobHeight: slider(0.035, 0, 0.1, 0.001, "Meters the head rises and dips on every step"),
      bobSway: slider(
        0.02,
        0,
        0.06,
        0.001,
        "Meters the head sways sideways, once to each side every two steps",
      ),
      bobRoll: slider(0.3, 0, 2, 0.01, "Degrees the view rolls with the sideways sway"),
      stepVariation: slider(
        0.1,
        0,
        0.5,
        0.01,
        "How much each step's Head Bob differs from the last (0.1 is 90 % to 110 %), kept for the whole step",
      ),
      blendRate: slider(
        10,
        1,
        30,
        0.1,
        "How fast the Head Bob comes in when Walking starts and Breathing comes back when it stops; higher is quicker",
      ),
      walkingSpeed: slider(
        1,
        0.2,
        4,
        0.01,
        "Meters per second at which the Head Bob is at full strength; slower Walking (a half-tilted stick, sliding along a wall) bobs less",
      ),
      breathHeight: slider(0.008, 0, 0.03, 0.0005, "Meters the head rises and sinks Breathing"),
      breathPitch: slider(0.15, 0, 1, 0.01, "Degrees the view tilts up and down Breathing"),
      breathRate: slider(0.25, 0.05, 1, 0.01, "Breaths per second"),
      breathSecondRate: slider(
        0.37,
        0.05,
        1,
        0.01,
        "A second, weaker breathing rhythm layered on the first so it never sounds like a metronome; keep it unrelated to the first",
      ),
      driftSway: slider(
        0.004,
        0,
        0.02,
        0.0005,
        "Meters the head drifts sideways standing still, very slowly",
      ),
      driftRoll: slider(0.12, 0, 1, 0.01, "Degrees the view rolls with the drift"),
      driftRate: slider(0.07, 0.01, 0.3, 0.005, "How fast the drift wanders, in cycles per second"),
    },
    { collapsed: true },
  )
  return useMemo<CameraMotionSettings>(() => ({ ...values }), [values])
}
