import { slider } from "@/debug/slider"
import type { EmitterShape } from "./soundEmitter"
import { DARKEST_TONE, OPEN_TONE } from "./shaping"

const VOLUME_STEP = 0.01

const MAX_VOLUME = 2

const MAX_PITCH = 12

const PITCH_STEP = 0.1

const SHARE_STEP = 0.01

export function volumeSlider(value: number, hint: string) {
  return slider(value, 0, MAX_VOLUME, VOLUME_STEP, `${hint}; 1 is as recorded, 0 silent`)
}

export function pitchSlider(value: number, hint: string) {
  return slider(
    value,
    -MAX_PITCH,
    MAX_PITCH,
    PITCH_STEP,
    `${hint}, in semitones (12 is an octave). It also plays faster when higher, slower when lower`,
  )
}

export function pitchVariationSlider(value: number, hint: string) {
  return slider(value, 0, MAX_PITCH / 2, PITCH_STEP, `${hint}, in semitones; 0 never varies`)
}

export function muffleSlider(value: number, hint: string) {
  return slider(
    value,
    0,
    1,
    SHARE_STEP,
    `${hint}: cuts the high frequencies, as if heard through a wall or a blanket. 0 is as recorded`,
  )
}

export function toneOf(muffle: number) {
  return OPEN_TONE * (DARKEST_TONE / OPEN_TONE) ** muffle
}

export function emitterSliders(defaults: EmitterShape) {
  return {
    distance: slider(
      defaults.refDistance,
      0.1,
      5,
      VOLUME_STEP,
      "Meters within which it is heard at full loudness",
    ),
    rolloff: slider(
      defaults.rolloff,
      0,
      5,
      VOLUME_STEP,
      "How fast it fades past that distance; 0 never fades",
    ),
    maxDistance: slider(
      defaults.maxDistance,
      1,
      50,
      VOLUME_STEP,
      "Meters past which it stops fading further",
    ),
  }
}

export type EmitterValues = { distance: number; rolloff: number; maxDistance: number }

export function emitterShapeOf({ distance, rolloff, maxDistance }: EmitterValues): EmitterShape {
  return { refDistance: distance, rolloff, maxDistance }
}

export type VariationDefaults = {
  volumeVariation: number
  muffleVariation: number
  lengthVariation: number
  timingVariation: number
}

export function variationSliders(defaults: VariationDefaults, what: string) {
  return {
    volumeVariation: slider(
      defaults.volumeVariation,
      0,
      1,
      SHARE_STEP,
      `Random loudness change on every ${what}, as a share (0.2 is 80 % to 120 %); 0 never varies`,
    ),
    muffleVariation: slider(
      defaults.muffleVariation,
      0,
      0.5,
      SHARE_STEP,
      `Random change of muffle on every ${what}, up or down; 0 never varies`,
    ),
    lengthVariation: slider(
      defaults.lengthVariation,
      0,
      0.8,
      SHARE_STEP,
      `How much of the end of every ${what} may be cut off at random (faded out), as a share of the file; 0 always plays it whole`,
    ),
    timingVariation: slider(
      defaults.timingVariation,
      0,
      0.5,
      0.005,
      `Random delay of every ${what}, up to this many seconds; 0 plays it right on time`,
    ),
  }
}
