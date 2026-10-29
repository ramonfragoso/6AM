import { newRattle } from "@/doorWall/doorRattle"
import { nightClock } from "@/night/nightClock"
import type { Haunt } from "./haunts"
import { besideCoatRack } from "./triggers"

export const ANGRY_DOOR_RATTLE: Haunt = {
  id: "angryDoorRattle",
  name: "Angry Door Rattle",
  kind: "loud",
  trigger: besideCoatRack,
  haunt: (state, { sinceManifest }) => {
    state.doorRattle ??= newRattle(nightClock() - sinceManifest)
  },
}
