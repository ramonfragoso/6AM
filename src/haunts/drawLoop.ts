import { MathUtils } from "three"
import { LOOP_OUTCOMES, type LoopOutcome } from "@/night/loops"
import { hauntById } from "./allHaunts"
import { isFeatured } from "./featuredHaunts"
import { HAUNT_RULES, type NightSoFar, type OutcomeWeights } from "./hauntRules"
import { type Haunt, HAUNT_KINDS, type HauntKind } from "./haunts"
import { pooledHaunts, type Standings } from "./pool"

export type HauntOdds = { atMidnight: OutcomeWeights; atSix: OutcomeWeights }

export type DrawSettings = {
  odds: HauntOdds
  enabledRules: ReadonlySet<string>
  finalHour: number
  found: ReadonlySet<string>
  newGamePlus: boolean
}

export type FiredRule = { name: string; factors: Partial<OutcomeWeights> }

export type LoopDraw = {
  outcome: LoopOutcome
  haunt: Haunt | null
  odds: OutcomeWeights
  fired: FiredRule[]
}

export type ForcedLoop = string

const CLEAN_ONLY: OutcomeWeights = { loud: 0, subtle: 0, clean: 1 }

const UNFOUND_CLEAN_ODDS = 0.1

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
  for (const kind of HAUNT_KINDS) if (pooledHaunts(kind, standings).length === 0) weights[kind] = 0
  const unfound = settings.newGamePlus ? unfoundHaunts(standings, settings.found) : []
  const normal = normalized(weights)
  const odds = unfound.length > 0 ? withFewerCleanLoops(normal) : normal
  const picked = pickOutcome(odds, random)
  const previous = previousHaunt(night)
  const featured = featuresHaunts(night, settings) ? featuredHaunts(standings) : []
  const haunt =
    picked === "clean"
      ? null
      : unfound.length > 0
        ? pickFrom(preferred(unfound, isFeatured), previous, random)
        : featured.length > 0
          ? pickFrom(featured, previous, random)
          : pickFrom(pooledHaunts(picked, standings), previous, random)
  return {
    outcome: haunt?.kind ?? "clean",
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

function pickFrom(haunts: Haunt[], previous: string | null, random: () => number) {
  const choices = preferred(haunts, (haunt) => haunt.id !== previous)
  return choices[Math.floor(random() * choices.length)] ?? null
}

function allPooledHaunts(standings: Standings) {
  return HAUNT_KINDS.flatMap((kind) => pooledHaunts(kind, standings))
}

function unfoundHaunts(standings: Standings, found: ReadonlySet<string>) {
  return allPooledHaunts(standings).filter((haunt) => !found.has(haunt.id))
}

function featuresHaunts({ hour }: NightSoFar, { newGamePlus, finalHour }: DrawSettings) {
  return !newGamePlus && hour < finalHour
}

function featuredHaunts(standings: Standings) {
  return allPooledHaunts(standings).filter(isFeatured)
}

function withFewerCleanLoops(odds: OutcomeWeights): OutcomeWeights {
  const drawable = HAUNT_KINDS.filter((kind) => odds[kind] > 0)
  if (drawable.length === 0 || odds.clean <= UNFOUND_CLEAN_ODDS) return odds
  const moved = odds.clean - UNFOUND_CLEAN_ODDS
  const fewer = { ...odds, clean: odds.clean - moved }
  for (const kind of drawable) fewer[kind] += moved / drawable.length
  return fewer
}

function preferred(haunts: Haunt[], wanted: (haunt: Haunt) => boolean) {
  const kept = haunts.filter(wanted)
  return kept.length > 0 ? kept : haunts
}

function previousHaunt({ loops }: NightSoFar) {
  return loops.at(-1)?.haunt ?? null
}
