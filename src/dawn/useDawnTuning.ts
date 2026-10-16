import { useEffect } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { dawnTiming } from "./dawnTiming"

const STEP = 0.1

export function useDawnTuning() {
  const { fadeOut, buttonDelay, fadeIn } = useTuningControls(
    "Dawn",
    {
      fadeOut: slider(
        dawnTiming.fadeOut,
        0.1,
        10,
        STEP,
        "Seconds the picture and every Sound take to fade to black once the Hour 6 Loop is passed",
      ),
      buttonDelay: slider(
        dawnTiming.buttonDelay,
        0,
        5,
        STEP,
        "Seconds of black before Play again shows",
      ),
      fadeIn: slider(
        dawnTiming.fadeIn,
        0.1,
        10,
        STEP,
        "Seconds the new Night takes to fade in after Play again",
      ),
    },
    { collapsed: true },
  )

  useEffect(() => {
    Object.assign(dawnTiming, { fadeOut, buttonDelay, fadeIn })
  }, [fadeOut, buttonDelay, fadeIn])
}
