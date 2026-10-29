import type { HauntKind } from "@/haunts/haunts"

export const LOOP_OUTCOMES = ["loud", "subtle", "clean"] as const

export type LoopOutcome = HauntKind | "clean"

export type Way = "ahead" | "back" | "down"

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

export function passes(outcome: LoopOutcome, way: Way) {
  if (way === "down") return false
  return outcome === "clean" ? way === "ahead" : way === "back"
}
