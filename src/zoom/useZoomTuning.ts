import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { muffleSlider, pitchVariationSlider, volumeSlider } from "@/sound/soundSliders"
import { useTuningControls } from "@/tuning/useTuningControls"
import type { ZoomSoundSettings } from "./zoomSound"

export type ZoomSettings = {
  maxZoom: number
  duration: number
  maxFocus: number
  focusSeconds: number
  sound: ZoomSoundSettings
}

const MAX_OUT_PITCH = 12

const PITCH_STEP = 0.1

export function useZoomTuning() {
  const { maxZoom, duration, maxFocus, focusSeconds } = useTuningControls(
    "Camera.Zoom",
    {
      maxZoom: slider(
        2.5,
        1,
        8,
        0.05,
        "How many times closer things look at full Zoom (2 is twice as close); 1 never zooms",
      ),
      duration: slider(
        0.43,
        0.1,
        2,
        0.01,
        "Seconds from no Zoom to full Zoom, and back. The Zoom Sound is sped up or slowed down to last exactly this long (0.43 plays it as recorded)",
      ),
      maxFocus: slider(
        50,
        2,
        200,
        0.5,
        "The farthest the Focus goes at full Zoom, in meters, in place of Depth of Field › Focus maxFocus. It moves there only once the Zoom is full, so far things come sharp while the Player watches",
      ),
      focusSeconds: slider(
        1,
        0.05,
        5,
        0.05,
        "Seconds the farthest Focus takes to move to maxFocus once the Zoom is full, and back after letting go (eased); the Focus then follows at Depth of Field › Focus fartherSpeed",
      ),
    },
    { collapsed: true },
  )
  const sound = useTuningControls(
    "Sound.Zoom",
    {
      volume: volumeSlider(1, "Loudness of the Zoom Sound"),
      muffle: muffleSlider(0, "Muffles the Zoom Sound"),
      outPitch: slider(
        -1,
        -MAX_OUT_PITCH,
        MAX_OUT_PITCH,
        PITCH_STEP,
        "Semitones added to the Zoom Sound when zooming back out. It still ends when the Zoom does; when the result is above the zoom-in pitch it may end a little early",
      ),
      outPitchVariation: pitchVariationSlider(
        1,
        "Random pitch change every time the Zoom goes back out",
      ),
    },
    { collapsed: true },
  )
  return useMemo<ZoomSettings>(
    () => ({
      maxZoom,
      duration,
      maxFocus,
      focusSeconds,
      sound,
    }),
    [maxZoom, duration, maxFocus, focusSeconds, sound],
  )
}
