import { type RefObject, useEffect, useMemo } from "react"
import type { Object3D } from "three"
import { loopState } from "@/passage/loopState"
import { preloadSounds } from "@/sound/audioEngine"
import { playSound } from "@/sound/playSound"
import { randomSpread } from "@/sound/shaping"
import { emitterShapeOf, toneOf } from "@/sound/soundSliders"
import type { SoundName } from "@/sound/sounds"
import { useSoundEmitter } from "@/sound/useSoundEmitter"
import { type ClockEvent, clockEvents } from "./clockEvents"
import type { ClockSoundSettings } from "./useClockSoundTuning"

type Cue = { sound: SoundName; volume: number; pitch: number }

const CLOCK_SOUNDS: SoundName[] = ["clockTick", "clockBug", "clockRing"]

const SECOND_STEP_PITCH = 5

const MINUTE_STEP_PITCH = -4

const STEP_PITCH_VARIATION = 2.5

export function useClockSounds(clock: RefObject<Object3D | null>, settings: ClockSoundSettings) {
  const { distance, rolloff, maxDistance } = settings
  const shape = useMemo(
    () => emitterShapeOf({ distance, rolloff, maxDistance }),
    [distance, rolloff, maxDistance],
  )
  const emitter = useSoundEmitter(clock, {
    bus: "effects",
    shape,
    presence: inSafeRoom,
  })

  useEffect(() => preloadSounds(CLOCK_SOUNDS), [])

  useEffect(
    () =>
      clockEvents.listen((event) => {
        const cue = cueOf(event, settings)
        if (!cue) return
        playSound(cue.sound, {
          from: emitter.current,
          volume: settings.volume * cue.volume,
          pitch: cue.pitch,
          tone: toneOf(settings.muffle),
        })
      }),
    [emitter, settings],
  )
}

function inSafeRoom() {
  return loopState.lampLevel
}

function cueOf(event: ClockEvent, settings: ClockSoundSettings): Cue | null {
  switch (event.kind) {
    case "tick":
      return event.second % 2 === 0
        ? tickCue(settings.tick, settings.tickPitch, settings.pitchVariation)
        : tickCue(settings.tock, settings.tockPitch, settings.pitchVariation)
    case "glitchStart":
      return { sound: "clockBug", volume: settings.glitch, pitch: settings.glitchPitch }
    case "glitchStep":
      return tickCue(
        settings.glitchSteps,
        settings.tickPitch + (event.hand === "second" ? SECOND_STEP_PITCH : MINUTE_STEP_PITCH),
        STEP_PITCH_VARIATION,
      )
    case "ring":
      return { sound: "clockRing", volume: settings.ring, pitch: settings.ringPitch }
    case "stall":
    case "reset":
      return null
  }
}

function tickCue(volume: number, pitch: number, variation: number): Cue {
  return { sound: "clockTick", volume, pitch: pitch + randomSpread(variation) }
}
