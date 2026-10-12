import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { DENOISERS, type Denoiser } from "./volumetricFog"

const DENOISER_SELECT = { value: DENOISERS[0] as Denoiser, options: DENOISERS }

export function useFogTuning() {
  return useTuningControls(
    "Fog",
    {
      enabled: true,
      fogColor: "#3b3a38",
      denoiser: {
        ...DENOISER_SELECT,
        hint: "How the low resolution fog is brought back to full size: depth-guided upsampling (sharp edges), a plain blur, or none",
      },
      resolutionScale: slider(0.4, 0.25, 0.75, 0.05, "Fog resolution, as a fraction of the screen"),
      steps: slider(16, 4, 32, 1, "Samples along each ray: more is smoother and slower"),
      density: slider(1.2, 0, 3, 0.05, "How quickly the fog blocks the view"),
      cloudThreshold: slider(
        0.5,
        0,
        0.8,
        0.02,
        "Noise below this is clear air: higher means patchier fog",
      ),
      cloudScale: slider(0.12, 0.01, 1, 0.01, "Size of the patches: higher means smaller patches"),
      maxRayDistance: slider(30, 5, 70, 1, "Meters a ray travels through the fog at most"),
      heightFalloff: slider(0.6, 0.2, 4, 0.1, "How fast the fog thins toward its top"),
      fogHeight: slider(3.2, 0.2, 8, 0.1, "Height of the fog layer above the Floor, in meters"),
      cloudSpeed: slider(0.04, 0, 1, 0.005, "How fast the patches drift"),
      rangeFogNear: slider(
        10,
        0,
        100,
        0.5,
        "Distance where the plain distance fog starts, in meters",
      ),
      rangeFogFar: slider(30, 5, 150, 0.5, "Distance where the plain distance fog is complete"),
      spatialSigma: slider(1.2, 0.5, 3, 0.1, "Upsampling blur width (depth-guided only)"),
      depthSensitivity: slider(30, 1, 100, 1, "How strongly depth edges stop the upsampling blur"),
      blurRadius: slider(0.5, 0, 1, 0.01, "Blur radius (blur only)"),
    },
    { collapsed: true },
  )
}
