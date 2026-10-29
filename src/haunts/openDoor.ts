import { newDoorAjar } from "@/doorWall/doorAjar"
import { nightClock } from "@/night/nightClock"
import type { Haunt } from "./haunts"

export const OPEN_DOOR: Haunt = {
  id: "openDoor",
  name: "Open Door",
  kind: "loud",
  haunt: (state, { sinceChosen }) => {
    state.doorAjar ??= newDoorAjar(nightClock() - sinceChosen)
  },
}
