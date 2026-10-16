import type { HauntKind } from "@/haunts/haunts"

export const LOOP_OUTCOMES = ["loud", "subtle", "clean"] as const

export type LoopOutcome = HauntKind | "clean"

export type Way = "ahead" | "back"

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
  return outcome === "clean" ? way === "ahead" : way === "back"
}
