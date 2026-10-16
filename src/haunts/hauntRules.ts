import type { LoopOutcome, LoopRecord } from "@/night/loops"

export type OutcomeWeights = Record<LoopOutcome, number>

export type NightSoFar = { hour: number; loops: readonly LoopRecord[] }

export type HauntRule = {
  name: string
  hint: string
  locked: boolean
  weigh: (night: NightSoFar) => Partial<OutcomeWeights> | null
}

const FORBIDDEN = 0

const FEWER_LOUD = 0.3

const IN_A_ROW = 2

export const HAUNT_RULES: readonly HauntRule[] = [
  {
    name: "firstLoopClean",
    hint: "The first Loop of a Night is always Clean (always on)",
    locked: true,
    weigh: ({ loops }) => (loops.length === 0 ? { loud: FORBIDDEN, subtle: FORBIDDEN } : null),
  },
  {
    name: "noThirdCleanInARow",
    hint: `No Clean Loop after ${IN_A_ROW} Clean Loops in a row`,
    locked: false,
    weigh: ({ loops }) => (lastLoopsWere(loops, "clean") ? { clean: FORBIDDEN } : null),
  },
  {
    name: "fewerLoudInARow",
    hint: `Loud odds × ${FEWER_LOUD} after ${IN_A_ROW} Loud Loops in a row`,
    locked: false,
    weigh: ({ loops }) => (lastLoopsWere(loops, "loud") ? { loud: FEWER_LOUD } : null),
  },
]

function lastLoopsWere(loops: readonly LoopRecord[], outcome: LoopOutcome, count = IN_A_ROW) {
  return loops.length >= count && loops.slice(-count).every((loop) => loop.outcome === outcome)
}
