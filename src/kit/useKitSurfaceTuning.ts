import { useEffect } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { kitSurface } from "./kitSurface"

export function useKitSurfaceTuning() {
  const tuning = useTuningControls(
    "Kit Surface",
    {
      occlusion: slider(1, 0, 5, 0.001, "Baked ambient occlusion, also darkening direct light"),
      grime: slider(0.6, 0, 1, 0.01, "Baked dirt near the floor, in corners and on ledges"),
      variation: slider(0.15, 0, 0.5, 0.01, "Brightness swings that break up texture repetition"),
      variationScale: slider(0.35, 0.05, 2, 0.01, "Size of the variation: lower is larger patches"),
      tileBrightness: slider(0.06, 0, 0.3, 0.01, "Brightness difference between floor tiles"),
      tileRoughness: slider(0.08, 0, 0.3, 0.01, "Roughness difference between floor tiles"),
    },
    { collapsed: true },
  )

  useEffect(() => {
    kitSurface.occlusion.value = tuning.occlusion
    kitSurface.grime.value = tuning.grime
    kitSurface.variation.value = tuning.variation
    kitSurface.variationScale.value = tuning.variationScale
    kitSurface.tileBrightness.value = tuning.tileBrightness
    kitSurface.tileRoughness.value = tuning.tileRoughness
  }, [
    tuning.occlusion,
    tuning.grime,
    tuning.variation,
    tuning.variationScale,
    tuning.tileBrightness,
    tuning.tileRoughness,
  ])
}
