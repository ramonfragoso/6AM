import { newGhostAttack } from "@/ghost/ghost"
import { nightClock } from "@/night/nightClock"
import type { Haunt } from "./haunts"

export const GHOST_ATTACK: Haunt = {
  id: "ghostAttack",
  name: "Ghost Attack",
  kind: "loud",
  haunt: (state, { sinceChosen }) => {
    state.ghostAttack ??= newGhostAttack(nightClock() - sinceChosen)
  },
}
