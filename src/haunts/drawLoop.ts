import { MathUtils } from "three"
import { LOOP_OUTCOMES, type LoopOutcome } from "@/night/loops"
import { hauntById, hauntsOfKind } from "./allHaunts"
import { HAUNT_RULES, type NightSoFar, type OutcomeWeights } from "./hauntRules"
import { type Haunt, HAUNT_KINDS, type HauntKind } from "./haunts"
import { pooledHaunts, type Standings } from "./pool"

export type HauntOdds = { atMidnight: OutcomeWeights; atSix: OutcomeWeights }

export type DrawSettings = { odds: HauntOdds; enabledRules: ReadonlySet<string>; finalHour: number }

export type FiredRule = { name: string; factors: Partial<OutcomeWeights> }

export type LoopDraw = {
  outcome: LoopOutcome
  haunt: Haunt | null
  odds: OutcomeWeights
  fired: FiredRule[]
}

export type ForcedLoop = string

const CLEAN_ONLY: OutcomeWeights = { loud: 0, subtle: 0, clean: 1 }

export function drawLoop(
  night: NightSoFar,
  settings: DrawSettings,
  standings: Standings,
  random: () => number = Math.random,
): LoopDraw {
  const weights = baseWeights(settings, night.hour)
  const fired: FiredRule[] = []
  for (const rule of HAUNT_RULES) {
    if (!rule.locked && !settings.enabledRules.has(rule.name)) continue
    const factors = rule.weigh(night)
    if (!factors) continue
    fired.push({ name: rule.name, factors })
    for (const outcome of LOOP_OUTCOMES) weights[outcome] *= factors[outcome] ?? 1
  }
  for (const kind of HAUNT_KINDS) if (hauntsOfKind(kind).length === 0) weights[kind] = 0
  const odds = normalized(weights)
  const outcome = pickOutcome(odds, random)
  const haunt =
    outcome === "clean" ? null : pickHaunt(outcome, standings, previousHaunt(night), random)
  return {
    outcome,
    haunt,
    odds,
    fired,
  }
}

export function forcedLoop(choice: ForcedLoop): LoopDraw {
  const haunt = choice === "clean" ? null : hauntById(choice)
  if (!haunt)
    return {
      outcome: "clean",
      haunt: null,
      odds: CLEAN_ONLY,
      fired: [],
    }
  return {
    outcome: haunt.kind,
    haunt,
    odds: { ...CLEAN_ONLY, clean: 0, [haunt.kind]: 1 },
    fired: [],
  }
}

function baseWeights({ odds, finalHour }: DrawSettings, hour: number): OutcomeWeights {
  const blend = MathUtils.clamp(hour / finalHour, 0, 1)
  return Object.fromEntries(
    LOOP_OUTCOMES.map((outcome) => [
      outcome,
      Math.max(0, MathUtils.lerp(odds.atMidnight[outcome], odds.atSix[outcome], blend)),
    ]),
  ) as OutcomeWeights
}

function normalized(weights: OutcomeWeights): OutcomeWeights {
  const total = LOOP_OUTCOMES.reduce((sum, outcome) => sum + weights[outcome], 0)
  if (total <= 0) return { ...CLEAN_ONLY }
  return Object.fromEntries(
    LOOP_OUTCOMES.map((outcome) => [outcome, weights[outcome] / total]),
  ) as OutcomeWeights
}

function pickOutcome(odds: OutcomeWeights, random: () => number): LoopOutcome {
  let left = random()
  for (const outcome of LOOP_OUTCOMES) {
    if (odds[outcome] <= 0) continue
    left -= odds[outcome]
    if (left < 0) return outcome
  }
  return LOOP_OUTCOMES.findLast((outcome) => odds[outcome] > 0) ?? "clean"
}

function pickHaunt(
  kind: HauntKind,
  standings: Standings,
  previous: string | null,
  random: () => number,
) {
  const pooled = pooledHaunts(kind, standings)
  const candidates = pooled.length > 0 ? pooled : hauntsOfKind(kind)
  const fresh = candidates.filter((haunt) => haunt.id !== previous)
  const choices = fresh.length > 0 ? fresh : candidates
  return choices[Math.floor(random() * choices.length)] ?? null
}

function previousHaunt({ loops }: NightSoFar) {
  return loops.at(-1)?.haunt ?? null
}
