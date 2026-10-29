import { useHauntLife } from "./useHauntLife"
import { useHauntSettingsTuning } from "./useHauntSettingsTuning"
import { useHauntShadows } from "./useHauntShadows"
import { useHauntsTuning } from "./useHauntsTuning"

export function Haunts() {
  useHauntsTuning()
  useHauntSettingsTuning()
  useHauntLife()
  useHauntShadows()
  return null
}
