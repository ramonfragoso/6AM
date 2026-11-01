import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import type { FocusSettings } from "./focus"

export function useDepthOfFieldTuning() {
  return useTuningControls(
    "Depth of Field",
    {
      enabled: true,
      focalLength: slider(
        4,
        0.1,
        30,
        0.1,
        "Meters from the Focus, nearer or farther, where the blur reaches full strength",
      ),
      bokehScale: slider(3, 0, 12, 0.1, "Size of the full blur, in pixels"),
    },
    { collapsed: true },
  )
}

export function useFocusTuning(): FocusSettings {
  return useTuningControls(
    "Depth of Field.Focus",
    {
      nearerSpeed: slider(6, 0.1, 30, 0.1, "How fast the Focus moves to something nearer"),
      fartherSpeed: slider(3, 0.1, 30, 0.1, "How fast the Focus moves to something farther"),
      minFocus: slider(0.3, 0.1, 5, 0.05, "The nearest the Focus goes, in meters"),
      maxFocus: slider(
        30,
        2,
        100,
        0.5,
        "The farthest the Focus goes, in meters (looking into darkness reads as far away). At full Zoom, Camera › Zoom maxFocus takes over",
      ),
      spread: slider(
        0.02,
        0,
        0.1,
        0.005,
        "How far from the middle of the screen the Focus also looks, as a share of its height; it takes the nearest",
      ),
    },
    { collapsed: true },
  )
}
