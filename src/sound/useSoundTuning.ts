import { useEffect } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { setVolumes } from "./audioEngine"

const STEP = 0.01

export function useSoundTuning() {
  const { master, effects, ambience, music } = useTuningControls(
    "Sound",
    {
      master: slider(1, 0, 2, STEP, "Loudness of everything; 0 mutes the game"),
      effects: slider(1, 0, 2, STEP, "Sounds things make: the Clock, later steps and doors"),
      ambience: slider(1, 0, 2, STEP, "Background sound of the House"),
      music: slider(1, 0, 2, STEP, "Music"),
    },
    { collapsed: true },
  )

  useEffect(
    () =>
      setVolumes({
        master,
        effects,
        ambience,
        music,
      }),
    [master, effects, ambience, music],
  )
}
