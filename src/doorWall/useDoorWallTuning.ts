import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import type { DoorLightSettings } from "./doorLight"

const OPEN_STEP = 0.1

const CLOSED = 0

const WIDE_OPEN = 110

const STEP = 0.001

const DECIMALS = 3

const COLLAPSED = { collapsed: true }

export function useDoorWallTuning() {
  const { open } = useTuningControls(
    "Door Wall",
    {
      open: slider(
        CLOSED,
        CLOSED,
        WIDE_OPEN,
        OPEN_STEP,
        "How far the door is open, in degrees; it swings away from the corridor around its hinge",
      ),
    },
    COLLAPSED,
  )
  const light = useDoorLightControls()
  return { open, light }
}

function useDoorLightControls() {
  const values = useTuningControls(
    "Door Wall.Light",
    {
      intensity: fineSlider(8, 0, 30, "Brightness of the spot light on the door; 0 turns it off"),
      color: { value: "#ffb070", hint: "Color of the light on the door" },
      out: fineSlider(1.2, 0.2, 2, "Meters in front of the door, into the corridor"),
      along: fineSlider(0, -2, 2, "Meters along the wall from the door's middle"),
      height: fineSlider(2.7, 0.5, 3.2, "Height of the light above the Floor, in meters"),
      aimHeight: fineSlider(1.3, 0, 3, "Height on the door the light points at, in meters"),
      angle: fineSlider(35, 5, 80, "Half-angle of the cone, in degrees"),
      penumbra: fineSlider(
        0.6,
        0,
        1,
        "Softness of the cone's edge: 0 is hard, 1 fades from the middle",
      ),
      distance: fineSlider(4, 0.5, 10, "Meters until the light fades out"),
      decay: fineSlider(1.5, 0, 3, "How fast the light fades with distance (2 is physical)"),
    },
    COLLAPSED,
  )
  return useMemo<DoorLightSettings>(() => ({ ...values }), [values])
}

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}
