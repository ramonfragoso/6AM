import { ringClock, setClockHour, showHour } from "@/clock/clockTime"
import {
  type DrawSettings,
  drawLoop,
  type FiredRule,
  forcedLoop,
  type HauntOdds,
  type LoopDraw,
} from "@/haunts/drawLoop"
import { hauntEvents } from "@/haunts/hauntEvents"
import type { OutcomeWeights } from "@/haunts/hauntRules"
import type { Haunt } from "@/haunts/haunts"
import { resetHauntState } from "@/haunts/hauntState"
import {
  catchHaunt,
  freshRefills,
  freshStandings,
  missHaunt,
  refillWhenEmpty,
  type Refills,
  type Standings,
} from "@/haunts/pool"
import { loopState } from "@/passage/loopState"
import { type LoopOutcome, type LoopRecord, passes, type Way } from "./loops"
import { nightClock } from "./nightClock"
import { nightEvents } from "./nightEvents"

export const FINAL_HOUR = 6

export const DRAW = "draw"

export type NightPhase = "playing" | "dawn"

export type HauntStage = "armed" | "manifested"

export type CurrentLoop = {
  number: number
  hour: number
  outcome: LoopOutcome
  haunt: Haunt | null
  stage: HauntStage | null
  chosenAt: number
  manifestedAt: number | null
  odds: OutcomeWeights
  fired: FiredRule[]
  forced: boolean
}

export type NightState = {
  night: number
  hour: number
  phase: NightPhase
  loop: CurrentLoop
  loops: LoopRecord[]
  standings: Standings
  refills: Refills
}

type LoopStart = { forced: boolean; number: number; hour: number }

const EVEN_WEIGHTS: OutcomeWeights = { loud: 1, subtle: 1, clean: 1 }

type NightDrawSettings = DrawSettings & { nextLoop: string; forcedOnce: string | null }

const drawSettings: NightDrawSettings = {
  odds: { atMidnight: EVEN_WEIGHTS, atSix: EVEN_WEIGHTS },
  enabledRules: new Set(),
  finalHour: FINAL_HOUR,
  nextLoop: DRAW,
  forcedOnce: null,
}

export const nightState: NightState = {
  night: 0,
  hour: 0,
  phase: "playing",
  loop: currentLoop(forcedLoop("clean"), { forced: false, number: 1, hour: 0 }),
  loops: [],
  standings: freshStandings(),
  refills: freshRefills(),
}

beginNight()

export function startNight() {
  beginNight()
  nightEvents.emit({ kind: "newNight" })
}

export function endLoop(way: Way) {
  const { loop, standings, refills } = nightState
  const passed = passes(loop.outcome, way)
  const manifested = loop.stage === "manifested"
  nightState.loops.push({
    number: loop.number,
    hour: loop.hour,
    outcome: loop.outcome,
    haunt: loop.haunt?.id ?? null,
    manifested,
    way,
    passed,
    forced: loop.forced,
  })
  if (loop.haunt && manifested) {
    if (passed) catchHaunt(standings, loop.haunt)
    else missHaunt(standings, loop.haunt)
    refillWhenEmpty(standings, refills)
  }
  nightEvents.emit({ kind: "verdict", passed, way })
  if (passed && nightState.hour === FINAL_HOUR) {
    nightState.phase = "dawn"
    ringClock()
    nightEvents.emit({ kind: "dawn" })
    return
  }
  nightState.hour = passed ? nightState.hour + 1 : 0
  showHour(nightState.hour)
  chooseLoop()
}

export function manifestHaunt() {
  const { loop } = nightState
  if (!loop.haunt || loop.stage !== "armed") return
  loop.stage = "manifested"
  loop.manifestedAt = nightClock()
  hauntEvents.emit({ kind: "manifest", haunt: loop.haunt })
}

export function shiftHour(by: number) {
  const hour = Math.min(Math.max(nightState.hour + by, 0), FINAL_HOUR)
  if (hour === nightState.hour) return
  nightState.hour = hour
  nightState.loop.hour = hour
  showHour(hour)
}

export function setHauntOdds(odds: HauntOdds) {
  drawSettings.odds = odds
}

export function setEnabledRules(names: Iterable<string>) {
  drawSettings.enabledRules = new Set(names)
}

export function forceLoopOnce(choice: string) {
  drawSettings.forcedOnce = choice
  if (canChooseAgain()) chooseLoop()
}

export function loopForcedOnce() {
  return drawSettings.forcedOnce
}

export function setNextLoop(choice: string) {
  if (choice === drawSettings.nextLoop) return
  drawSettings.nextLoop = choice
  if (canChooseAgain()) chooseLoop()
}

function beginNight() {
  Object.assign(nightState, {
    night: nightState.night + 1,
    hour: 0,
    phase: "playing",
    loops: [],
    standings: freshStandings(),
    refills: freshRefills(),
  })
  setClockHour(0)
  chooseLoop()
}

function chooseLoop() {
  resetHauntState()
  const choice = drawSettings.forcedOnce ?? drawSettings.nextLoop
  drawSettings.forcedOnce = null
  const forced = choice !== DRAW
  const draw = forced
    ? forcedLoop(choice)
    : drawLoop(nightState, drawSettings, nightState.standings)
  nightState.loop = currentLoop(draw, {
    forced,
    number: nightState.loops.length + 1,
    hour: nightState.hour,
  })
  if (draw.haunt && !draw.haunt.trigger) manifestHaunt()
}

function currentLoop(draw: LoopDraw, { forced, number, hour }: LoopStart): CurrentLoop {
  return {
    number,
    hour,
    outcome: draw.outcome,
    haunt: draw.haunt,
    stage: draw.haunt ? "armed" : null,
    chosenAt: nightClock(),
    manifestedAt: null,
    odds: draw.odds,
    fired: draw.fired,
    forced,
  }
}

function canChooseAgain() {
  return (
    nightState.phase === "playing" && loopState.whereabouts === "startRoom" && !loopState.passing
  )
}
