import { nightClock } from "@/night/nightClock"
import { newChairMove } from "@/props/chairMove"
import type { Haunt } from "./haunts"
import { besideCoatRack } from "./triggers"

export const CHAIR_MOVING: Haunt = {
  id: "chairMoving",
  name: "Chair Moving",
  kind: "loud",
  trigger: besideCoatRack,
  haunt: (state, { sinceManifest }) => {
    state.chairMove ??= newChairMove(nightClock() - sinceManifest)
  },
}
