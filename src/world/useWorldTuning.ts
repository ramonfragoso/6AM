import type { Vector3Tuple } from "three"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

const POINT_LIGHT_POSITION: Vector3Tuple = [2, 2, -1]

export function useWorldTuning() {
  const lighting = useTuningControls(
    "Lighting",
    {
      ambientIntensity: slider(4, 0, 20, 0.1),
      directionalIntensity: slider(2.1, 0, 10, 0.1),
      directionalColor: "#ffffff",
      pointIntensity: slider(500, 0, 500, 0.1),
      pointPosition: { value: POINT_LIGHT_POSITION, step: 0.01 },
      pointColor: "#626262",
    },
    { collapsed: true },
  )

  return { lighting }
}
