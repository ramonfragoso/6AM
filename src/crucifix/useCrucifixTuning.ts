import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { BLENDER_HEIGHT, type CrucifixSpot } from "./crucifix"

const STEP = 0.001

const DECIMALS = 3

export function useCrucifixTuning() {
  const values = useTuningControls(
    "Crucifix",
    {
      height: fineSlider(
        BLENDER_HEIGHT,
        1,
        3.2,
        "Height of the cross's center above the Floor in meters (2.183 is where it hangs in Blender)",
      ),
      size: fineSlider(
        1,
        0.3,
        2.5,
        "Scale of the whole crucifix around the center of the cross, so it stays on the door",
      ),
    },
    { collapsed: true },
  )
  return useMemo<CrucifixSpot>(() => ({ ...values }), [values])
}

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}
