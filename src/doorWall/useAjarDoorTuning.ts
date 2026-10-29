import { button } from "leva"
import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { hauntState } from "@/haunts/hauntState"
import { nightClock } from "@/night/nightClock"
import { emitterShapeOf, emitterSliders, muffleSlider, volumeSlider } from "@/sound/soundSliders"
import { useTuningControls } from "@/tuning/useTuningControls"
import { type AjarSettings, newDoorAjar } from "./doorAjar"

const SLAM_EMITTER = { refDistance: 3, rolloff: 0.8, maxDistance: 20 }

const STEP = 0.001

const DECIMALS = 3

const MAX_SOUND_OFFSET = 300

const COLLAPSED = { collapsed: true }

export function useAjarDoorTuning() {
  const ajar = useTuningControls(
    "Haunts.Open Door",
    {
      "Leave open": button(() => {
        hauntState.doorAjar = newDoorAjar(nightClock())
      }),
      Shut: button(() => {
        hauntState.doorAjar = null
      }),
      angle: fineSlider(15, 1, 60, "Degrees the door stands open while it waits"),
      reach: fineSlider(
        2.5,
        0.5,
        6,
        "Meters from the gap (at the door's free edge) within which looking at it slams the door",
      ),
      facing: fineSlider(
        20,
        2,
        60,
        "Degrees the Player's view may be off the gap and still count as looking at it",
      ),
      flicker: fineSlider(
        1,
        0,
        2,
        "Flicker of the Tiled Lantern right after the slam; the slam itself moves like an Angry Door Rattle Slam (its closeSeconds, closePower, rebound and Shake)",
      ),
      flickerSeconds: fineSlider(
        0.25,
        0,
        2,
        "Seconds that flicker lasts after the slam, then it goes back to its own Flames › Tiled Lantern flicker",
      ),
    },
    COLLAPSED,
  )
  const sound = useTuningControls(
    "Sound.Door Slam",
    {
      volume: volumeSlider(1, "Loudness of the Open Door slamming shut"),
      muffle: muffleSlider(0, "Muffles the slam"),
      soundOffset: slider(
        0,
        -MAX_SOUND_OFFSET,
        MAX_SOUND_OFFSET,
        1,
        "Milliseconds the sound is moved against the door: negative plays it earlier, to make up for audio latency",
      ),
      ...emitterSliders(SLAM_EMITTER),
    },
    COLLAPSED,
  )
  const settings = useMemo<AjarSettings>(() => ({ ...ajar }), [ajar])
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
