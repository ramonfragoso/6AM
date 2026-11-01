import { fadeAllSound } from "@/sound/audioEngine"
import { blackoutEvents } from "./blackoutEvents"

export type BlackoutTiming = {
  before: number
  fadeOut: number
  soundOut: number
  black: number
  fadeIn: number
}

export type Blackout = { since: number; covered: boolean }

const SILENT = 0

const FULL_VOLUME = 1

export function startBlackout(now: number): Blackout {
  return { since: now, covered: false }
}

export function advanceBlackout(blackout: Blackout, now: number, timing: BlackoutTiming) {
  const seconds = now - blackout.since
  if (!blackout.covered && seconds >= timing.before) {
    blackout.covered = true
    fadeAllSound(SILENT, timing.soundOut)
    blackoutEvents.emit({ kind: "fadeOut", seconds: timing.fadeOut })
  }
  if (seconds < timing.before + timing.fadeOut + timing.black) return false
  uncover(timing.fadeIn)
  return true
}

export function cancelBlackout(blackout: Blackout) {
  if (blackout.covered) uncover(0)
}

function uncover(seconds: number) {
  fadeAllSound(FULL_VOLUME, seconds)
  blackoutEvents.emit({ kind: "fadeIn", seconds })
}
