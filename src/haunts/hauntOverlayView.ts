import { FINAL_HOUR, loopForcedOnce, type NightState } from "@/night/night"
import { LOOP_OUTCOMES, type LoopOutcome, type LoopRecord } from "@/night/loops"
import { loopState } from "@/passage/loopState"
import { hauntById, hauntNumber, hauntsOfKind } from "./allHaunts"
import type { OutcomeWeights } from "./hauntRules"
import { HAUNT_KINDS, type HauntKind } from "./haunts"
import { isMockHaunt } from "./mockHaunts"
import { type HauntStanding, isRefilled, isSeenOnce } from "./pool"

export type HauntStatus = "unseen" | "caught" | "missed" | "refilled"

export type HauntCell = {
  id: string
  label: string
  name: string
  status: HauntStatus
  current: boolean
}

export type KindRow = { kind: string; refills: string; cells: HauntCell[] }

export type HauntOverlayView = {
  night: string
  loop: string
  forcedOnce: string | null
  passesBy: string
  last: string
  odds: string
  rules: string
  kinds: KindRow[]
}

const OUTCOME_NAMES: Record<LoopOutcome, string> = {
  loud: "Loud",
  subtle: "Subtle",
  clean: "Clean",
}

const PERCENT = 100

const MIDNIGHT = 12

const NONE = "—"

export const CLEAN = "clean"

export function hauntOverlayView(night: NightState): HauntOverlayView {
  const { loop } = night
  return {
    night: `NIGHT ${night.night} · HOUR ${night.hour} (${clockHour(night.hour)}) · ${whereabouts(night)}`,
    loop: [`LOOP ${loop.number}  ${OUTCOME_NAMES[loop.outcome]}`, ...hauntParts(night)].join(" · "),
    forcedOnce: forcedOnceText(loopForcedOnce()),
    passesBy: `passes by going ${loop.outcome === "clean" ? "AHEAD" : "BACK"}`,
    last: lastLoop(night.loops.at(-1)),
    odds: LOOP_OUTCOMES.map(
      (outcome) => `${OUTCOME_NAMES[outcome]} ${percent(loop.odds, outcome)}`,
    ).join(" · "),
    rules:
      loop.fired.length === 0
        ? NONE
        : loop.fired
            .map(({ name, factors }) =>
              [
                name,
                ...LOOP_OUTCOMES.filter((outcome) => outcome in factors).map(
                  (outcome) => `×${factors[outcome]} ${OUTCOME_NAMES[outcome]}`,
                ),
              ].join(" "),
            )
            .join("  "),
    kinds: HAUNT_KINDS.map((kind) => kindRow(kind, night)),
  }
}

function hauntParts({ loop }: NightState) {
  const parts: string[] = []
  if (loop.haunt)
    parts.push(loop.haunt.name, stageText(loop.stage, loop.manifestedAt, loop.chosenAt))
  if (loop.forced) parts.push("forced")
  return parts
}

function stageText(stage: string | null, manifestedAt: number | null, chosenAt: number) {
  if (stage !== "manifested" || manifestedAt === null) return "Armed"
  return `Manifested +${(manifestedAt - chosenAt).toFixed(1)} s`
}

function lastLoop(record: LoopRecord | undefined) {
  if (!record) return NONE
  const name = record.haunt ? (hauntById(record.haunt)?.name ?? record.haunt) : null
  const haunt = name ? ` (${name}${record.manifested ? "" : ", never Manifested"})` : ""
  return `Loop ${record.number}  ${OUTCOME_NAMES[record.outcome]}${haunt} · went ${record.way} · ${record.passed ? "passed" : "failed"}`
}

function kindRow(kind: HauntKind, night: NightState): KindRow {
  return {
    kind: OUTCOME_NAMES[kind],
    refills: kindRule(kind, night.refills[kind]),
    cells: hauntsOfKind(kind).map((haunt) => ({
      id: haunt.id,
      label: isMockHaunt(haunt) ? String(hauntNumber(haunt)) : haunt.name,
      name: haunt.name,
      status: statusOf(night.standings[haunt.id]),
      current: night.loop.haunt?.id === haunt.id,
    })),
  }
}

function statusOf({ inPool, caught, lastVerdict }: HauntStanding): HauntStatus {
  if (lastVerdict) return lastVerdict
  if (inPool && caught > 0) return "refilled"
  return "unseen"
}

function forcedOnceText(choice: string | null) {
  if (choice === null) return null
  const name = choice === CLEAN ? "Clean" : (hauntById(choice)?.name ?? choice)
  return `${name} is forced for the next Loop`
}

function kindRule(kind: HauntKind, refills: number) {
  const rules = [
    isSeenOnce(kind) ? "gone once seen" : "Missed ones repeat",
    isRefilled(kind) ? `refilled ${refills}` : "never refills",
  ]
  return rules.join(" · ")
}

function whereabouts(night: NightState) {
  if (night.phase === "dawn") return "Dawn"
  if (loopState.passing) return "Passage"
  return loopState.whereabouts === "startRoom" ? "Start Room" : "House"
}

function clockHour(hour: number) {
  return `${hour === 0 ? MIDNIGHT : hour}:00${hour === FINAL_HOUR ? " AM" : ""}`
}

function percent(odds: OutcomeWeights, outcome: LoopOutcome) {
  return `${Math.round(odds[outcome] * PERCENT)}%`
}
