import { clockEvents } from "./clockEvents"

export type MinuteStart = { minute: number; second: number }

export type ClockPhase = "counting" | "stalled" | "glitch"

export type ClockFace = {
  hour: number
  minute: number
  second: number
  phase: ClockPhase
}

type GlitchSteps = { minute: number[]; second: number[] }

type RunLengths = { shortest: number; longest: number }

const SECONDS_PER_MINUTE = 60

const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE

export const COUNTED_SECONDS = SECONDS_PER_MINUTE

export const STALL_SECONDS = 1

export const GLITCH_SECONDS = 2

const CYCLE_SECONDS = COUNTED_SECONDS + STALL_SECONDS + GLITCH_SECONDS

const GLITCH_RUNS = 3

const SECOND_RUNS: RunLengths = { shortest: 2, longest: 6 }

const MINUTE_RUNS: RunLengths = { shortest: 1, longest: 3 }

const CLOCKWISE_STEP = 1

const COIN_FLIP = 0.5

export const clockTime = {
  stuckAt: 0,
  elapsed: 0,
  cycle: 0,
  rate: 1,
  hour: 0,
  restarts: 0,
  minuteStart: { minute: 0, second: 0 } as MinuteStart,
}

let glitchCache: { key: string; steps: GlitchSteps } | null = null

export function setMinuteStart(start: MinuteStart) {
  clockTime.minuteStart = start
  restartMinute()
}

export function setClockHour(hour: number) {
  clockTime.hour = hour
  restartMinute()
}

export function showHour(hour: number) {
  setClockHour(hour)
  ringClock()
}

export function ringClock() {
  clockEvents.emit({ kind: "ring" })
}

export function runClock(delta: number) {
  clockTime.elapsed += delta * clockTime.rate
  while (clockTime.elapsed >= CYCLE_SECONDS) {
    clockTime.elapsed -= CYCLE_SECONDS
    clockTime.cycle += 1
  }
}

export function clockFace({ stuckAt, elapsed, cycle } = clockTime): ClockFace {
  const hour = stuckAt
  const minute = Math.floor(stuckAt / SECONDS_PER_MINUTE)
  if (elapsed < COUNTED_SECONDS) {
    return {
      hour,
      minute,
      second: Math.floor(elapsed),
      phase: "counting",
    }
  }
  const stalledFace: ClockFace = {
    hour,
    minute: minute + 1,
    second: 0,
    phase: "stalled",
  }
  const intoGlitch = elapsed - COUNTED_SECONDS - STALL_SECONDS
  if (intoGlitch < 0) return stalledFace
  const steps = glitchSteps(cycle, stuckAt)
  return {
    hour,
    minute: stalledFace.minute + stepsTaken(steps.minute, intoGlitch),
    second: stepsTaken(steps.second, intoGlitch),
    phase: "glitch",
  }
}

export function sameFace(a: ClockFace, b: ClockFace) {
  return a.hour === b.hour && a.minute === b.minute && a.second === b.second && a.phase === b.phase
}

function restartMinute() {
  const { hour, minuteStart } = clockTime
  clockTime.stuckAt = hour * SECONDS_PER_HOUR + minuteStart.minute * SECONDS_PER_MINUTE
  clockTime.elapsed = Math.min(minuteStart.second, COUNTED_SECONDS - 1)
  clockTime.cycle = 0
  clockTime.restarts += 1
}

function stepsTaken(steps: number[], intoGlitch: number) {
  const taken = Math.min(steps.length, Math.floor((intoGlitch / GLITCH_SECONDS) * steps.length) + 1)
  return steps.slice(0, taken).reduce((sum, step) => sum + step, 0)
}

function glitchSteps(cycle: number, stuckAt: number): GlitchSteps {
  const key = `${stuckAt}:${cycle}`
  if (glitchCache?.key === key) return glitchCache.steps
  const steps = {
    second: runSteps(SECOND_RUNS, CLOCKWISE_STEP),
    minute: runSteps(MINUTE_RUNS, Math.random() < COIN_FLIP ? CLOCKWISE_STEP : -CLOCKWISE_STEP),
  }
  glitchCache = { key, steps }
  return steps
}

function runSteps({ shortest, longest }: RunLengths, firstStep: number) {
  return Array.from({ length: GLITCH_RUNS }, (_, run) => {
    const length = shortest + Math.floor(Math.random() * (longest - shortest + 1))
    const step = run % 2 === 0 ? firstStep : -firstStep
    return Array<number>(length).fill(step)
  }).flat()
}
