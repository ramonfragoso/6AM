import type { HauntKind } from "@/haunts/haunts"

export const LOOP_OUTCOMES = ["loud", "subtle", "clean"] as const

export type LoopOutcome = HauntKind | "clean"

export type Way = "ahead" | "back" | "down" | "strangled"

export type LoopRecord = {
  number: number
  hour: number
  outcome: LoopOutcome
  haunt: string | null
  manifested: boolean
  way: Way
  passed: boolean
  forced: boolean
}

export function wakesInStartRoom(way: Way) {
  return way === "down" || way === "strangled"
}

export function passes(outcome: LoopOutcome, way: Way) {
  if (wakesInStartRoom(way)) return false
  return outcome === "clean" ? way === "ahead" : way === "back"
}
