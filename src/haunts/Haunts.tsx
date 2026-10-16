import { useHauntLife } from "./useHauntLife"
import { useHauntsTuning } from "./useHauntsTuning"

export function Haunts() {
  useHauntsTuning()
  useHauntLife()
  return null
}
