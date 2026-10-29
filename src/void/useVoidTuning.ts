import { button } from "leva"
import { useEffect, useMemo } from "react"
import { slider } from "@/debug/slider"
import { hauntState } from "@/haunts/hauntState"
import { nightClock } from "@/night/nightClock"
import {
  emitterShapeOf,
  emitterSliders,
  muffleSlider,
  pitchSlider,
  volumeSlider,
} from "@/sound/soundSliders"
import { useTuningControls } from "@/tuning/useTuningControls"
import { newVoidDoor } from "./voidDoor"
import { type Creak, CREAKS, voidSettings } from "./voidSettings"

const CREAK_EMITTER = { refDistance: 3, rolloff: 0.8, maxDistance: 20 }

const STEP = 0.01

const MAX_SOUND_OFFSET = 300

const COLLAPSED = { collapsed: true }

export type CreakSound = ReturnType<typeof useVoidTuning>

export function useVoidTuning() {
  const door = useTuningControls(
    "Haunts.Void",
    {
      "Open now": button(() => {
        hauntState.voidDoor = newVoidDoor(nightClock())
      }),
      Shut: button(() => {
        hauntState.voidDoor = null
      }),
      triggerDistance: slider(
        voidSettings.triggerDistance,
        1,
        10,
        STEP,
        "Meters before the Crucifix door where the Player sets it off: about halfway between the Door Wall and the Candle Sets",
      ),
      delay: slider(
        voidSettings.delay,
        0,
        5,
        STEP,
        "Seconds from then until the door starts to open",
      ),
      openSeconds: slider(
        voidSettings.openSeconds,
        0.5,
        10,
        STEP,
        "Seconds the door takes to open, easing in and out",
      ),
      angle: slider(voidSettings.angle, 10, 110, 1, "Degrees the door opens into the Void"),
      shadowUpdates: slider(
        voidSettings.shadowUpdates,
        0,
        10,
        1,
        "Times per second the static shadow maps are drawn again while the door opens, so the light reaches through the widening gap; each costs a frame. 0 draws them only once, when it is fully open",
      ),
      crossingSeconds: slider(
        voidSettings.crossingSeconds,
        0,
        10,
        STEP,
        "Seconds, at an even pace, for the Fog and Dust to fade out once the Player crosses the door line into the Void, and to come back when they return",
      ),
    },
    COLLAPSED,
  )
  const fall = useTuningControls(
    "Haunts.Void.Fall",
    {
      fallSeconds: slider(
        voidSettings.fallSeconds,
        0,
        5,
        STEP,
        "Seconds of falling, from when the Player's eye drops below the Floor, before the picture fades out",
      ),
      fadeOut: slider(
        voidSettings.fadeOut,
        0.1,
        5,
        STEP,
        "Seconds the picture and every Sound take to fade to black",
      ),
      blackSeconds: slider(
        voidSettings.blackSeconds,
        0,
        5,
        STEP,
        "Seconds of black; then the Player is back in the Start Room and the Loop is failed",
      ),
      fadeIn: slider(voidSettings.fadeIn, 0.1, 5, STEP, "Seconds the Start Room takes to fade in"),
    },
    COLLAPSED,
  )
  const sound = useTuningControls(
    "Sound.Void Door",
    {
      creak: { value: CREAKS[1], options: CREAKS, hint: "Which Creak plays as the door opens" },
      fitToDoor: {
        value: true,
        hint: "On: the Creak is slowed down or sped up to last exactly as long as the door takes to open (Haunts › Void openSeconds), which lowers or raises its pitch. Off: it plays at pitch",
      },
      pitch: pitchSlider(0, "Pitch of the Creak while fitToDoor is off"),
      volume: volumeSlider(1, "Loudness of the Creak"),
      muffle: muffleSlider(0.1, "Muffles the Creak"),
      soundOffset: slider(
        0,
        -MAX_SOUND_OFFSET,
        MAX_SOUND_OFFSET,
        1,
        "Milliseconds the Creak is moved against the door: negative plays it earlier, to make up for audio latency",
      ),
      ...emitterSliders(CREAK_EMITTER),
    },
    COLLAPSED,
  )

  useEffect(() => void Object.assign(voidSettings, door, fall), [door, fall])

  return useMemo(
    () => ({
      creak: sound.creak as Creak,
      fitToDoor: sound.fitToDoor,
      pitch: sound.pitch,
      volume: sound.volume,
      muffle: sound.muffle,
      offset: sound.soundOffset,
      shape: emitterShapeOf(sound),
    }),
    [sound],
  )
}
