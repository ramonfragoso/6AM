import { ANGRY_DOOR_RATTLE } from "./angryDoorRattle"
import { COCKROACHES } from "./cockroaches"
import { GHOST_ATTACK } from "./ghostAttack"
import type { Haunt } from "./haunts"
import { LIGHTS_OUT } from "./lightsOut"
import { OPEN_DOOR } from "./openDoor"
import { VOID } from "./void"

export const FEATURED_HAUNTS: readonly Haunt[] = [
  LIGHTS_OUT,
  ANGRY_DOOR_RATTLE,
  OPEN_DOOR,
  VOID,
  GHOST_ATTACK,
  COCKROACHES,
]

const FEATURED_IDS: ReadonlySet<string> = new Set(FEATURED_HAUNTS.map((haunt) => haunt.id))

export function isFeatured(haunt: Haunt) {
  return FEATURED_IDS.has(haunt.id)
}
