import { button } from "leva"
import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { hauntState } from "@/haunts/hauntState"
import { nightClock } from "@/night/nightClock"
import { emitterShapeOf, emitterSliders, muffleSlider, volumeSlider } from "@/sound/soundSliders"
import { useTuningControls } from "@/tuning/useTuningControls"
import { type ChairMoveSettings, newChairMove } from "./chairMove"

const CHAIR_EMITTER = { refDistance: 2, rolloff: 1, maxDistance: 15 }

const STEP = 0.001

const DECIMALS = 3

const MAX_SOUND_OFFSET = 300

const COLLAPSED = { collapsed: true }

export function useChairMoveTuning() {
  const move = useTuningControls(
    "Haunts.Chair Moving",
    {
      "Move now": button(() => {
        hauntState.chairMove = newChairMove(nightClock())
      }),
      "Put back": button(() => {
        hauntState.chairMove = null
      }),
      shiftX: fineSlider(
        0.9,
        -2,
        2,
        "World meters the Chair slides along X: across the second Corridor, toward its far wall",
      ),
      shiftZ: fineSlider(0.2, -2, 2, "World meters the Chair slides along Z (along that Corridor)"),
      turn: fineSlider(25, -90, 90, "Degrees the Chair turns on the way, as if shoved off-center"),
      acceleration: fineSlider(
        2.5,
        1,
        6,
        "How the slide speeds up: 1 is steady, higher starts slower and hits its spot faster, stopping dead",
      ),
    },
    COLLAPSED,
  )
  const sound = useTuningControls(
    "Sound.Chair Moving",
    {
      volume: volumeSlider(1, "Loudness of the Chair scraping across the Floor"),
      muffle: muffleSlider(0, "Muffles the Chair"),
      soundOffset: slider(
        0,
        -MAX_SOUND_OFFSET,
        MAX_SOUND_OFFSET,
        1,
        "Milliseconds the sound is moved against the Chair: negative plays it earlier, to make up for audio latency",
      ),
      ...emitterSliders(CHAIR_EMITTER),
    },
    COLLAPSED,
  )
  const settings = useMemo<ChairMoveSettings>(() => ({ ...move }), [move])
  const soundSettings = useMemo(
    () => ({
      volume: sound.volume,
      muffle: sound.muffle,
      offset: sound.soundOffset,
      shape: emitterShapeOf(sound),
    }),
    [sound],
  )
  return { settings, sound: soundSettings }
}

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}
