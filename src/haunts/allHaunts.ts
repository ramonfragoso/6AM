import type { Haunt, HauntKind } from "./haunts"
import { MOCK_HAUNTS } from "./mockHaunts"

export const HAUNTS: readonly Haunt[] = MOCK_HAUNTS

export function hauntById(id: string) {
  return HAUNTS.find((haunt) => haunt.id === id) ?? null
}

export function hauntsOfKind(kind: HauntKind) {
  return HAUNTS.filter((haunt) => haunt.kind === kind)
}
