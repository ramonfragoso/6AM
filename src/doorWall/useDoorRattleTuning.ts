import { button } from "leva"
import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { hauntState } from "@/haunts/hauntState"
import { nightClock } from "@/night/nightClock"
import { emitterShapeOf, emitterSliders, muffleSlider, volumeSlider } from "@/sound/soundSliders"
import { useTuningControls } from "@/tuning/useTuningControls"
import { newRattle, type RattleSettings } from "./doorRattle"

const RATTLE_EMITTER = { refDistance: 3, rolloff: 0.8, maxDistance: 20 }

const STEP = 0.001

const DECIMALS = 3

const MAX_SOUND_OFFSET = 300

const COLLAPSED = { collapsed: true }

export function useDoorRattleTuning() {
  const rattle = useRattleControls()
  const shake = useShakeControls()
  const sound = useRattleSoundControls()
  const settings = useMemo<RattleSettings>(() => ({ ...rattle, shake }), [rattle, shake])
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

function useRattleControls() {
  return useTuningControls(
    "Haunts.Angry Door Rattle",
    {
      "Rattle now": button(() => {
        hauntState.doorRattle = newRattle(nightClock())
      }),
      firstOpenSeconds: fineSlider(
        0.8,
        0.2,
        3,
        "Seconds the door takes to open before the first Slam; the sound starts so its first Slam lands when the door first shuts",
      ),
      maxAngle: fineSlider(30, 0, 60, "Most the door ever opens between two Slams, in degrees"),
      anglePerSecond: fineSlider(
        40,
        5,
        200,
        "Degrees the door may open per second of time between two Slams, so quick Slams open it less",
      ),
      minShare: fineSlider(
        0.5,
        0,
        1,
        "Each opening is a random share of that, from this to 1 (1 always opens it fully)",
      ),
      restShare: fineSlider(
        0.15,
        0,
        0.6,
        "Share of the time between two Slams the door lies shut after a Slam (never less than its rebound)",
      ),
      closeSeconds: fineSlider(
        0.12,
        0.02,
        0.5,
        "Longest a Slam takes to shut the door, in seconds",
      ),
      closeShare: fineSlider(
        0.35,
        0.05,
        0.8,
        "Share of the time between two Slams the shutting may take at most",
      ),
      closePower: fineSlider(
        3,
        1,
        6,
        "How the shutting speeds up: 1 is steady, 3 keeps accelerating until it hits the frame",
      ),
      reboundAngle: fineSlider(
        2,
        0,
        8,
        "Degrees the door bounces back open after each Slam, shutting again on the second knock; 0 has none",
      ),
      lanternFlicker: fineSlider(
        1,
        0,
        2,
        "Flicker of the Tiled Lantern while the door rattles; it goes back to its own Flames › Tiled Lantern flicker after the last Slam",
      ),
    },
    COLLAPSED,
  )
}

function useShakeControls() {
  return useTuningControls(
    "Haunts.Angry Door Rattle.Shake",
    {
      distance: fineSlider(
        3,
        0,
        15,
        "Millimeters the Door Leaf knocks in and out of its frame after each Slam",
      ),
      tilt: fineSlider(
        0.15,
        0,
        2,
        "Degrees the Door Leaf leans in and out of its frame after each Slam (its top moves most)",
      ),
      frequency: fineSlider(25, 2, 60, "Rattles per second"),
      seconds: fineSlider(0.3, 0, 1, "Seconds the rattle takes to die out after each Slam"),
    },
    COLLAPSED,
  )
}

function useRattleSoundControls() {
  return useTuningControls(
    "Sound.Door Rattle",
    {
      volume: volumeSlider(1, "Loudness of the Angry Door Rattle's Slams"),
      muffle: muffleSlider(0, "Muffles the Slams"),
      soundOffset: slider(
        0,
        -MAX_SOUND_OFFSET,
        MAX_SOUND_OFFSET,
        1,
        "Milliseconds the sound is moved against the door: negative plays it earlier, to make up for audio latency",
      ),
      ...emitterSliders(RATTLE_EMITTER),
    },
    COLLAPSED,
  )
}

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}
