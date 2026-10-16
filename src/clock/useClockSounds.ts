import { type RefObject, useEffect, useMemo } from "react"
import type { Object3D } from "three"
import { loopState } from "@/passage/loopState"
import { preloadSounds } from "@/sound/audioEngine"
import { playSound } from "@/sound/playSound"
import type { SoundName } from "@/sound/sounds"
import { useSoundEmitter } from "@/sound/useSoundEmitter"
import { type ClockEvent, clockEvents } from "./clockEvents"
import type { ClockSoundSettings } from "./useClockSoundTuning"

type Cue = { sound: SoundName; volume: keyof ClockLoudness; rate?: number }

type ClockLoudness = Pick<ClockSoundSettings, "tick" | "glitch" | "ring">

const CLOCK_SOUNDS: SoundName[] = [
  "clockTick",
  "clockTock",
  "clockClunk",
  "clockGlitch",
  "clockRing",
]

const SECOND_STEP_RATE = 1.35

const MINUTE_STEP_RATE = 0.8

const RESET_RATE = 1.3

const RATE_JITTER = 0.15

export function useClockSounds(clock: RefObject<Object3D | null>, settings: ClockSoundSettings) {
  const shape = useMemo(
    () => ({
      refDistance: settings.distance,
      rolloff: settings.rolloff,
      maxDistance: settings.maxDistance,
    }),
    [settings.distance, settings.rolloff, settings.maxDistance],
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
        const cue = cueOf(event)
        if (!cue) return
        playSound(cue.sound, {
          from: emitter.current,
          volume: settings.volume * settings[cue.volume],
          rate: cue.rate,
        })
      }),
    [emitter, settings],
  )
}

function inSafeRoom() {
  return loopState.lampLevel
}

function cueOf(event: ClockEvent): Cue | null {
  switch (event.kind) {
    case "tick":
      return { sound: event.second % 2 === 0 ? "clockTick" : "clockTock", volume: "tick" }
    case "stall":
      return { sound: "clockClunk", volume: "tick" }
    case "glitchStart":
      return { sound: "clockGlitch", volume: "glitch" }
    case "glitchStep":
      return event.hand === "second"
        ? { sound: "clockTick", volume: "glitch", rate: jittered(SECOND_STEP_RATE) }
        : { sound: "clockTock", volume: "glitch", rate: jittered(MINUTE_STEP_RATE) }
    case "reset":
      return { sound: "clockClunk", volume: "glitch", rate: RESET_RATE }
    case "ring":
      return { sound: "clockRing", volume: "ring" }
  }
}

function jittered(rate: number) {
  return rate * (1 + (Math.random() * 2 - 1) * RATE_JITTER)
}
