import { MathUtils, type Vector3Tuple } from "three"
import { DOOR_LINE, ROOM_HALF_WIDTH, ROOM_HEIGHT } from "@/safeRoom/safeRooms"
import type { DawnLightSettings } from "./dawnLightSettings"

export type DawnLightAim = { position: Vector3Tuple; target: Vector3Tuple; angle: number }

const ROOM_INTERIOR_HALF_DEPTH = 1.95

const IN_FRONT_OF_DOORWAY_WALL = 0.005

const PAST_ROOM_WALLS = 0.3

const FRONT = ROOM_INTERIOR_HALF_DEPTH - IN_FRONT_OF_DOORWAY_WALL

const BACK = -ROOM_INTERIOR_HALF_DEPTH - PAST_ROOM_WALLS

const BOTTOM = -PAST_ROOM_WALLS

const TOP = ROOM_HEIGHT + PAST_ROOM_WALLS

const HALF_WIDTH = ROOM_HALF_WIDTH + PAST_ROOM_WALLS

export const LIGHT_FILLED_BOX: { center: Vector3Tuple; size: Vector3Tuple } = {
  center: [0, (BOTTOM + TOP) / 2, (FRONT + BACK) / 2],
  size: [HALF_WIDTH * 2, TOP - BOTTOM, FRONT - BACK],
}

export function dawnLightAim({
  back,
  height,
  aimOut,
  aimHeight,
  angle,
}: DawnLightSettings): DawnLightAim {
  return {
    position: [0, height, DOOR_LINE - back],
    target: [0, aimHeight, DOOR_LINE + aimOut],
    angle: MathUtils.degToRad(angle),
  }
}
