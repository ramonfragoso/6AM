import { useEffect } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { titleSettings } from "./titleSettings"

const STEP = 0.1

const FINE_STEP = 0.01

export function useTitleTuning() {
  const view = useTuningControls(
    "Title",
    {
      distance: slider(
        titleSettings.distance,
        0.2,
        3,
        FINE_STEP,
        "Meters from the Clock to the camera behind the title, on the way to the Player's eye",
      ),
      height: slider(
        titleSettings.height,
        -0.5,
        1,
        FINE_STEP,
        "Meters the camera behind the title sits above the point it looks at",
      ),
      lookHeight: slider(
        titleSettings.lookHeight,
        0,
        0.8,
        0.005,
        "Meters above the Clock's base that the camera behind the title looks at",
      ),
      glideSeconds: slider(
        titleSettings.glideSeconds,
        0.5,
        12,
        STEP,
        "Seconds the camera takes after Play to glide from the Clock to the Player's eye",
      ),
      titleFadeIn: slider(
        titleSettings.titleFadeIn,
        0,
        6,
        STEP,
        "Seconds 6AM takes to fade in once the loading screen is gone",
      ),
      playDelay: slider(
        titleSettings.playDelay,
        0,
        6,
        STEP,
        "Seconds after 6AM starts fading in before Play fades in",
      ),
      fadeOut: slider(
        titleSettings.fadeOut,
        0,
        4,
        STEP,
        "Seconds 6AM and Play take to fade out after Play",
      ),
    },
    { collapsed: true },
  )

  useEffect(() => {
    Object.assign(titleSettings, view)
  }, [view])
}
