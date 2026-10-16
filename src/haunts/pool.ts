import { HAUNTS, hauntsOfKind } from "./allHaunts"
import { type Haunt, HAUNT_KINDS, type HauntKind } from "./haunts"

export type HauntStanding = { inPool: boolean; caught: number; missed: number }

export type Standings = Record<string, HauntStanding>

export type Refills = Record<HauntKind, number>

export function freshStandings(): Standings {
  return Object.fromEntries(
    HAUNTS.map((haunt) => [haunt.id, { inPool: true, caught: 0, missed: 0 }]),
  )
}

export function freshRefills(): Refills {
  return { loud: 0, subtle: 0 }
}

export function catchHaunt(standings: Standings, haunt: Haunt) {
  standings[haunt.id].inPool = false
  standings[haunt.id].caught += 1
}

export function missHaunt(standings: Standings, haunt: Haunt) {
  standings[haunt.id].missed += 1
}

export function refillEmptyKinds(standings: Standings, refills: Refills) {
  for (const kind of HAUNT_KINDS) {
    const haunts = hauntsOfKind(kind)
    if (haunts.length === 0 || haunts.some((haunt) => standings[haunt.id].inPool)) continue
    for (const haunt of haunts) standings[haunt.id].inPool = true
    refills[kind] += 1
  }
}

export function pooledHaunts(kind: HauntKind, standings: Standings) {
  return hauntsOfKind(kind).filter((haunt) => standings[haunt.id].inPool)
}
