import { nightClock } from "@/night/nightClock"
import { newVoidDoor } from "@/void/voidDoor"
import type { Haunt } from "./haunts"
import { nearCrucifixDoor } from "./triggers"

export const VOID: Haunt = {
  id: "void",
  name: "Void",
  kind: "loud",
  trigger: nearCrucifixDoor,
  haunt: (state, { sinceManifest }) => {
    state.voidDoor ??= newVoidDoor(nightClock() - sinceManifest)
  },
}
