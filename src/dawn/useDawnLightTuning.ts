import { useEffect } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { type DawnLightSettings, dawnLightSettings } from "./dawnLightSettings"

const STEP = 0.01

export function useDawnLightTuning(): DawnLightSettings {
  const settings = useTuningControls(
    "Dawn.Light",
    {
      passageSeconds: slider(
        dawnLightSettings.passageSeconds,
        1,
        20,
        STEP,
        "Seconds of the Passage through the door that brings Dawn, slower than Passage duration so the light has time to pour out; Passage › Timing still sets its shares",
      ),
      intensity: slider(
        dawnLightSettings.intensity,
        0,
        300,
        0.1,
        "Brightness of the spot light that shines out of the doorway into the Corridor once the door is fully open; it rises as the door opens and stays mounted at 0 otherwise, since adding a light recompiles every shader",
      ),
      color: {
        value: dawnLightSettings.color,
        hint: "Color of the Dawn Light, on the Corridor and in the doorway",
      },
      glow: slider(
        dawnLightSettings.glow,
        1,
        20,
        STEP,
        "How bright the light-filled room looks through the doorway; above 1 it spills Bloom around the doorway",
      ),
      back: slider(
        dawnLightSettings.back,
        0,
        2,
        STEP,
        "Meters behind the door line, inside the room, where the spot light sits",
      ),
      height: slider(
        dawnLightSettings.height,
        0.2,
        3,
        STEP,
        "Meters above the Floor of the spot light",
      ),
      aimOut: slider(
        dawnLightSettings.aimOut,
        0.5,
        10,
        STEP,
        "Meters out into the Corridor where the spot light points",
      ),
      aimHeight: slider(
        dawnLightSettings.aimHeight,
        0,
        3,
        STEP,
        "Meters above the Floor where the spot light points",
      ),
      angle: slider(
        dawnLightSettings.angle,
        5,
        89,
        0.1,
        "Half the cone, in degrees: how wide the light fans out of the doorway",
      ),
      penumbra: slider(dawnLightSettings.penumbra, 0, 1, STEP, "Softness of the cone's edge"),
      distance: slider(dawnLightSettings.distance, 1, 40, STEP, "Meters the light reaches"),
      decay: slider(dawnLightSettings.decay, 0, 3, STEP, "How fast it fades with distance"),
      whiteFrom: slider(
        dawnLightSettings.whiteFrom,
        0,
        3,
        STEP,
        "Meters before the door line where the screen starts turning white as the Player walks into the light",
      ),
      whiteTo: slider(
        dawnLightSettings.whiteTo,
        0.1,
        3,
        STEP,
        "Meters past the door line where the screen is fully white",
      ),
    },
    { collapsed: true },
  )

  useEffect(() => {
    Object.assign(dawnLightSettings, settings)
  }, [settings])

  return settings
}
