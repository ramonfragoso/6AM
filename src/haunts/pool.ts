import { HAUNTS, hauntsOfKind } from "./allHaunts"
import type { Haunt, HauntKind } from "./haunts"

export type Verdict = "caught" | "missed"

export type HauntStanding = {
  inPool: boolean
  caught: number
  missed: number
  lastVerdict: Verdict | null
}

export type Standings = Record<string, HauntStanding>

export type Refills = Record<HauntKind, number>

const SEEN_ONCE_KINDS: ReadonlySet<HauntKind> = new Set<HauntKind>(["loud"])

const REFILLED_KINDS: readonly HauntKind[] = ["subtle"]

export function freshStandings(): Standings {
  return Object.fromEntries(
    HAUNTS.map((haunt) => [
      haunt.id,
      {
        inPool: true,
        caught: 0,
        missed: 0,
        lastVerdict: null,
      },
    ]),
  )
}

export function freshRefills(): Refills {
  return { loud: 0, subtle: 0 }
}

export function catchHaunt(standings: Standings, haunt: Haunt) {
  const standing = standings[haunt.id]
  standing.inPool = false
  standing.caught += 1
  standing.lastVerdict = "caught"
}

export function missHaunt(standings: Standings, haunt: Haunt) {
  const standing = standings[haunt.id]
  standing.missed += 1
  standing.lastVerdict = "missed"
  if (isSeenOnce(haunt.kind)) standing.inPool = false
}

export function refillWhenEmpty(standings: Standings, refills: Refills) {
  if (HAUNTS.some((haunt) => standings[haunt.id].inPool)) return
  for (const kind of REFILLED_KINDS) {
    const haunts = hauntsOfKind(kind)
    if (haunts.length === 0) continue
    for (const haunt of haunts) {
      Object.assign(standings[haunt.id], { inPool: true, lastVerdict: null })
    }
    refills[kind] += 1
  }
}

export function pooledHaunts(kind: HauntKind, standings: Standings) {
  return hauntsOfKind(kind).filter((haunt) => standings[haunt.id].inPool)
}

export function isRefilled(kind: HauntKind) {
  return REFILLED_KINDS.includes(kind)
}

export function isSeenOnce(kind: HauntKind) {
  return SEEN_ONCE_KINDS.has(kind)
}
