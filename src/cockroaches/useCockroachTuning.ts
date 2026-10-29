import { button } from "leva"
import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { hauntState } from "@/haunts/hauntState"
import { nightClock } from "@/night/nightClock"
import {
  emitterShapeOf,
  emitterSliders,
  muffleSlider,
  pitchSlider,
  pitchVariationSlider,
  variationSliders,
  volumeSlider,
} from "@/sound/soundSliders"
import type { SoundVariation } from "@/sound/variedSound"
import { useTuningControls } from "@/tuning/useTuningControls"
import { newCockroaches, type WalkSettings } from "./cockroachWalk"

export const MAX_COCKROACHES = 400

export const MAX_VOICES = 6

const STEP = 0.01

const FINE_STEP = 0.001

const COLLAPSED = { collapsed: true }

const SKITTER_EMITTER = { refDistance: 1, rolloff: 1.5, maxDistance: 12 }

const SKITTER_VARIATION = {
  volumeVariation: 0.3,
  muffleVariation: 0.15,
  lengthVariation: 0.4,
  timingVariation: 0.1,
}

export type CockroachSound = ReturnType<typeof useCockroachTuning>["sound"]

export function useCockroachTuning() {
  const swarm = useTuningControls(
    "Haunts.Cockroaches",
    {
      "Release now": button(() => {
        hauntState.cockroaches = newCockroaches(nightClock(), Math.random())
      }),
      Clear: button(() => {
        hauntState.cockroaches = null
      }),
      count: slider(100, 0, MAX_COCKROACHES, 1, "How many Cockroaches come out"),
      size: slider(
        0.07,
        0.02,
        0.3,
        FINE_STEP,
        "Meters from a Cockroach's antenna tips to its tail, on average",
      ),
      sizeVariation: slider(
        0.3,
        0,
        0.8,
        STEP,
        "How much each Cockroach's size differs from the average, as a share (0.3 is 70 % to 130 %). Bigger ones also run faster",
      ),
      speed: slider(0.18, 0, 1.5, STEP, "Meters per second a Cockroach of average size runs"),
      speedVariation: slider(
        0.3,
        0,
        0.8,
        STEP,
        "How much each Cockroach's pace differs, as a share; 0 makes them all equally fast",
      ),
      burstSpeed: slider(
        0.6,
        0,
        3,
        STEP,
        "Meters per second of a sprint, and of running away from the Player",
      ),
      burstChance: slider(0.2, 0, 1, STEP, "Share of runs that are short sprints"),
      runMin: slider(0.3, 0.05, 5, STEP, "Shortest run, in seconds"),
      runMax: slider(2, 0.05, 5, STEP, "Longest run, in seconds"),
      stopMin: slider(0.1, 0, 5, STEP, "Shortest stop, in seconds"),
      stopMax: slider(
        0.9,
        0,
        5,
        STEP,
        "Longest stop, in seconds. Longer stops than runs leave fewer Cockroaches moving at once",
      ),
      turnAngle: slider(
        150,
        0,
        180,
        1,
        "Degrees a Cockroach may turn at most when it runs again after a stop",
      ),
      wobble: slider(
        90,
        0,
        400,
        1,
        "How much a running Cockroach's heading wanders, in degrees per second; 0 runs straight",
      ),
      followChance: slider(
        0.15,
        0,
        1,
        STEP,
        "Share of runs in which a Cockroach trails the nearest one on the same surface",
      ),
      followSeconds: slider(3, 0, 15, STEP, "Seconds a Cockroach trails another at most"),
      followDistance: slider(
        0.4,
        0.05,
        2,
        STEP,
        "Meters within which a Cockroach picks one to trail; it lets go at twice this",
      ),
      fleeDistance: slider(
        0.9,
        0,
        3,
        STEP,
        "Meters from the Player's body within which a Cockroach sprints away, without stopping",
      ),
      emergeSeconds: slider(
        6,
        0,
        30,
        STEP,
        "Seconds over which the Cockroaches crawl out of the cracks after the Trigger, one by one",
      ),
      climbMin: slider(
        0.3,
        0,
        3,
        STEP,
        "Meters up the wall the lowest first climb ends, before the random walk starts",
      ),
      climbMax: slider(2.8, 0, 3.5, STEP, "Meters up the wall the highest first climb ends"),
      roofShare: slider(
        0.15,
        0,
        1,
        STEP,
        "Share of Cockroaches whose first climb goes over the molding onto the roof",
      ),
      strideLength: slider(
        0.14,
        0.02,
        1,
        FINE_STEP,
        "Body lengths a Cockroach moves per walk cycle; the walk plays at speed / this, so the feet do not slide. Lower it if they slide forward",
      ),
      maxStrideRate: slider(
        12,
        1,
        30,
        0.5,
        "Walk cycles per second at most; faster than the frame rate the legs would flicker, so fast Cockroaches slide a little instead",
      ),
    },
    COLLAPSED,
  )
  const look = useTuningControls(
    "Haunts.Cockroaches.Look",
    {
      color: { value: "#ffffff", hint: "Tint multiplied into the Cockroach's texture" },
      roughness: slider(0.35, 0, 1, STEP, "0 is a glossy shell, 1 matte"),
    },
    COLLAPSED,
  )
  const sound = useTuningControls(
    "Sound.Cockroaches",
    {
      volume: volumeSlider(1, "Loudness of every skitter"),
      pitch: pitchSlider(0, "Pitch of every skitter"),
      pitchVariation: pitchVariationSlider(2, "Random pitch change on every skitter"),
      muffle: muffleSlider(0.1, "Muffles every skitter"),
      ...variationSliders(SKITTER_VARIATION, "skitter"),
      voices: slider(
        4,
        0,
        MAX_VOICES,
        1,
        "How many running Cockroaches near the Player skitter at once, each from where it is",
      ),
      overlap: slider(
        0.5,
        0,
        0.9,
        STEP,
        "Share of each skitter the next one on the same Cockroach overlaps, so they blend into one rustle",
      ),
      ...emitterSliders(SKITTER_EMITTER),
    },
    COLLAPSED,
  )

  const walk = useMemo<WalkSettings & { count: number }>(() => ({ ...swarm }), [swarm])
  const soundSettings = useMemo(
    () => ({
      variation: variationOf(sound),
      voices: sound.voices,
      overlap: sound.overlap,
      shape: emitterShapeOf(sound),
    }),
    [sound],
  )
  return { walk, look, sound: soundSettings }
}

function variationOf(values: SoundVariation): SoundVariation {
  return {
    volume: values.volume,
    volumeVariation: values.volumeVariation,
    pitch: values.pitch,
    pitchVariation: values.pitchVariation,
    muffle: values.muffle,
    muffleVariation: values.muffleVariation,
    lengthVariation: values.lengthVariation,
    timingVariation: values.timingVariation,
  }
}
