import { ANGRY_DOOR_RATTLE } from "./angryDoorRattle"
import { CHAIR_MOVING } from "./chairMoving"
import { COCKROACHES } from "./cockroaches"
import { GHOST_ATTACK } from "./ghostAttack"
import type { Haunt, HauntKind } from "./haunts"
import {
  INVERTED_CROSS,
  MANY_BOOKS_AND_BOTTLES,
  MISSING_COAT_AND_HAT,
  TILED_FLOOR_ROTATION,
} from "./houseHaunts"
import { LIGHTS_OUT } from "./lightsOut"
import { mockHaunts } from "./mockHaunts"
import { OPEN_DOOR } from "./openDoor"
import {
  GROWING_PAINTINGS,
  HORIZONTAL_PAINTINGS,
  SATURN_DEVOURING,
  SCARY_POPE,
} from "./paintingHaunts"
import { VOID } from "./void"

export const HAUNTS: readonly Haunt[] = [
  SCARY_POPE,
  INVERTED_CROSS,
  MANY_BOOKS_AND_BOTTLES,
  LIGHTS_OUT,
  ANGRY_DOOR_RATTLE,
  CHAIR_MOVING,
  OPEN_DOOR,
  VOID,
  GHOST_ATTACK,
  COCKROACHES,
  SATURN_DEVOURING,
  MISSING_COAT_AND_HAT,
  HORIZONTAL_PAINTINGS,
  TILED_FLOOR_ROTATION,
  GROWING_PAINTINGS,
  ...mockHaunts(16, 20),
]

export function hauntById(id: string) {
  return HAUNTS.find((haunt) => haunt.id === id) ?? null
}

export function hauntNumber(haunt: Haunt) {
  return HAUNTS.indexOf(haunt) + 1
}

export function hauntsOfKind(kind: HauntKind) {
  return HAUNTS.filter((haunt) => haunt.kind === kind)
}
