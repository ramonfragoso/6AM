import { useEffect, useMemo } from "react"
import { slider } from "@/debug/slider"
import { setEnabledRules, setHauntOdds } from "@/night/night"
import { useTuningControls } from "@/tuning/useTuningControls"
import { hauntOverlayToggle } from "./hauntOverlayToggle"
import { HAUNT_RULES, type OutcomeWeights } from "./hauntRules"

const WEIGHT_STEP = 0.01

const MAX_WEIGHT = 5

const EVEN_WEIGHT = 1

const SWITCHABLE_RULES = HAUNT_RULES.filter((rule) => !rule.locked)

export function useHauntsTuning() {
  const atMidnight = useOddsControls("Haunts.Odds at 12:00", "at Hour 0")
  const atSix = useOddsControls("Haunts.Odds at 6:00", "at Hour 6")
  const rules = useTuningControls(
    "Haunts.Rules",
    Object.fromEntries(
      SWITCHABLE_RULES.map((rule) => [rule.name, { value: false, hint: rule.hint }]),
    ),
    { collapsed: true },
  ) as Record<string, boolean>
  const { haunts } = useTuningControls("Debug", {
    haunts: {
      value: false,
      hint: "Show the Haunt overlay: Night, Hour, this Loop's Haunt, odds, rules and every Haunt's standing",
    },
  })

  useEffect(() => setHauntOdds({ atMidnight, atSix }), [atMidnight, atSix])
  const enabled = SWITCHABLE_RULES.filter((rule) => rules[rule.name]).map((rule) => rule.name)
  const enabledKey = enabled.join()
  useEffect(() => setEnabledRules(enabledKey ? enabledKey.split(",") : []), [enabledKey])
  useEffect(() => {
    hauntOverlayToggle.shown = haunts
  }, [haunts])
}

function useOddsControls(folder: string, when: string): OutcomeWeights {
  const { loud, subtle, clean } = useTuningControls(
    folder,
    {
      loud: weightSlider(
        `Weight of a Loud Haunt ${when}; Hours between blend toward the other end`,
      ),
      subtle: weightSlider(`Weight of a Subtle Haunt ${when}`),
      clean: weightSlider(`Weight of a Clean Loop ${when}`),
    },
    { collapsed: true },
  )
  return useMemo(() => ({ loud, subtle, clean }), [loud, subtle, clean])
}

function weightSlider(hint: string) {
  return slider(EVEN_WEIGHT, 0, MAX_WEIGHT, WEIGHT_STEP, hint)
}
