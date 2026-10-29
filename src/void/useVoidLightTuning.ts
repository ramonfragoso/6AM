import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import type { VoidLightSettings } from "./voidLight"

const STEP = 0.01

export function useVoidLightTuning(): VoidLightSettings {
  return useTuningControls(
    "Haunts.Void.Light",
    {
      intensity: slider(
        20,
        0,
        50,
        STEP,
        "Brightness of the spot light over the Void Floor; it is on only while the Void is open, and stays mounted at 0 otherwise, since adding a light recompiles every shader",
      ),
      color: { value: "#ffe2c0", hint: "Color of the light on the Void Floor" },
      across: slider(0, -3, 3, STEP, "Meters sideways from the door's middle, light and aim"),
      along: slider(2.5, 0, 6, STEP, "Meters past the door line where the light hangs"),
      height: slider(4.5, 1, 12, STEP, "Meters above the Floor where the light hangs"),
      aimAlong: slider(2.5, 0, 6, STEP, "Meters past the door line where it points on the Floor"),
      angle: slider(45, 5, 89, 0.1, "Half the cone, in degrees: how wide the pool of light is"),
      penumbra: slider(1, 0, 1, STEP, "Softness of the pool's edge; 1 fades from the middle out"),
      distance: slider(9, 1, 30, STEP, "Meters the light reaches, also the shadow's range"),
      decay: slider(1.5, 0, 3, STEP, "How fast it fades with distance"),
    },
    { collapsed: true },
  )
}
