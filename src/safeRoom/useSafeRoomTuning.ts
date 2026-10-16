import { useEffect, useMemo } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { furnitureShadowSettings } from "./furnitureShadow"
import { lampShadowStrength } from "./lampShadow"
import { safeRoomSurface } from "./useSafeRoomModel"

const STEP = 0.001

const DECIMALS = 3

export type CeilingLampSettings = {
  color: string
  glow: number
  light: number
  distance: number
  decay: number
  flicker: number
}

export function useSafeRoomTuning() {
  useSafeRoomSurfaceControls()
  useLampShadowControls()
  return useCeilingLampControls()
}

function useSafeRoomSurfaceControls() {
  const { occlusion, grime } = useTuningControls(
    "Safe Room",
    {
      occlusion: fineSlider(
        1,
        0,
        3,
        "Baked ambient occlusion in the Safe Rooms only; Kit Surface occlusion sets the Corridors",
      ),
      grime: fineSlider(0.3, 0, 1, "Baked dirt near the Floor and in corners, in the Safe Rooms"),
    },
    { collapsed: true },
  )

  useEffect(() => {
    safeRoomSurface.occlusion.value = occlusion
    safeRoomSurface.grime.value = grime
  }, [occlusion, grime])
}

function useLampShadowControls() {
  const { baked, furniture, softness, bias } = useTuningControls(
    "Safe Room.Lamp Shadows",
    {
      baked: fineSlider(
        1,
        0,
        1,
        "Shadows baked in Blender from the Ceiling Lamp (doors, the lamp itself, the dark ceiling above it); 0 lights everything",
      ),
      furniture: fineSlider(
        0.85,
        0,
        1,
        "Shadow the Clock Table casts from the Ceiling Lamp, drawn once each time it moves",
      ),
      softness: fineSlider(2.5, 0, 6, "Blur of the Clock Table's shadow edge, in shadow texels"),
      bias: fineSlider(
        0.02,
        0,
        0.1,
        "Meters a surface may sit behind the Clock Table before it is shadowed; raise it if the table speckles itself",
      ),
    },
    { collapsed: true },
  )

  useEffect(() => {
    lampShadowStrength.baked.value = baked
    lampShadowStrength.furniture.value = furniture
    furnitureShadowSettings.softness.value = softness
    furnitureShadowSettings.bias.value = bias
  }, [baked, furniture, softness, bias])
}

function useCeilingLampControls() {
  const values = useTuningControls(
    "Safe Room.Ceiling Lamp",
    {
      color: { value: "#f6f8ff", hint: "Color of the lamp's glowing disc and of its light" },
      glow: fineSlider(3, 0, 20, "Brightness of the round disc itself; it lights nothing else"),
      light: fineSlider(6, 0, 40, "Brightness of the Lamp Light; 0 turns it off"),
      distance: fineSlider(
        6,
        0.5,
        10,
        "Meters until the Lamp Light fades out; past the walls it shines into the Corridors",
      ),
      decay: fineSlider(1, 0, 3, "How fast the Lamp Light fades with distance (2 is physical)"),
      flicker: fineSlider(0, 0, 1, "How much the lamp wavers, like an old bulb; 0 is steady"),
    },
    { collapsed: true },
  )
  return useMemo<CeilingLampSettings>(() => ({ ...values }), [values])
}

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}
