import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { GUIDE_SPOT, HAUNT_COUNT_SPOT, type NoteSpot } from "./guides"

const STEP = 0.001

const DECIMALS = 3

const ALONG_REACH = 1.9

export type ReadingSettings = {
  reach: number
  facing: number
  fadeIn: number
  fadeOut: number
  darkness: number
  textDelay: number
}

export function useGuidesTuning() {
  const guide = useSpotControls("Guides.Guide", GUIDE_SPOT, "The Guide")
  const hauntCount = useSpotControls("Guides.Haunt Count", HAUNT_COUNT_SPOT, "The Haunt Count")
  return useMemo(() => ({ guide, hauntCount }), [guide, hauntCount])
}

export function useReadingTuning(): ReadingSettings {
  return useTuningControls(
    "Guides.Reading",
    {
      reach: slider(2, 0.5, 4, 0.05, "Meters from a Note's middle where its Prompt appears"),
      facing: slider(
        30,
        5,
        60,
        1,
        "Degrees the view may point away from a Note and still show its Prompt (the door's Prompt yields to it)",
      ),
      fadeIn: slider(0.9, 0.1, 3, 0.05, "Seconds the Reading takes to darken the screen and show"),
      fadeOut: slider(0.6, 0.1, 3, 0.05, "Seconds the Reading takes to fade away once closed"),
      darkness: slider(0.8, 0, 1, 0.01, "How dark the screen gets behind the Reading's text"),
      textDelay: slider(
        0.35,
        0,
        0.9,
        0.01,
        "Share of the fade spent darkening before the text starts to appear (and after it is gone)",
      ),
    },
    { collapsed: true },
  )
}

function useSpotControls(folder: string, spot: NoteSpot, name: string) {
  const values = useTuningControls(
    folder,
    {
      along: fineSlider(
        spot.along,
        -ALONG_REACH,
        ALONG_REACH,
        `Meters from the middle of the Start Room's door to ${name}'s middle, to the right as you face the door from inside (it moves with the Wrap, so it is room space)`,
      ),
      height: fineSlider(spot.height, 0.5, 3.5, `Meters from the Floor to ${name}'s middle`),
      out: fineSlider(spot.out, -0.05, 0.2, `Meters ${name}'s back stands off the wall`),
      size: fineSlider(spot.size, 0.3, 2, `Scale of ${name}, frame and paper together`),
    },
    { collapsed: true },
  )
  return useMemo<NoteSpot>(() => ({ ...values }), [values])
}

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}
