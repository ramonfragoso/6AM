import { Box3, Vector3, type Vector3Tuple } from "three"
import { FLOOR_PLANK_ROW_LENGTH } from "@/kit/corridorLayout"
import type { Placement } from "@/kit/kitPieces"
import {
  DOOR_LINE,
  doorFrameMatrix,
  ROOM_HALF_WIDTH,
  ROOM_HEIGHT,
  roomMatrix,
  SAFE_ROOMS,
} from "@/safeRoom/safeRooms"
import { VOID_DOORWAY, VOID_ROOM } from "./voidOpen"

const VOID_FLOOR_ROWS = 2

const STAGGERED_PLANK_ENDS = 0.41

const FLOOR_SINK = 0.015

const DIVISION_HALF_DEPTH = 0.2015

const PAST_EXTERIOR = 0.11

const BEHIND_EXTERIOR = DOOR_LINE + PAST_EXTERIOR

const DARKNESS_REACH = 500

const QUARTER_TURN = Math.PI / 2

const VOID_REACH = 1000

const CREAK_HEIGHT = 1.4

const fromVoidRoom = roomMatrix(VOID_ROOM)

const intoVoidRoom = fromVoidRoom.clone().invert()

const local = new Vector3()

export type DarknessPlane = { center: Vector3Tuple; size: [width: number, height: number] }

export const VOID_FLOOR: Placement[] = Array.from({ length: VOID_FLOOR_ROWS }, (_, row) => ({
  piece: "floor",
  position: voidRoomPoint(
    0,
    -FLOOR_SINK,
    DOOR_LINE + STAGGERED_PLANK_ENDS - row * FLOOR_PLANK_ROW_LENGTH,
  ),
  rotationY: SAFE_ROOMS[VOID_ROOM].rotationY + QUARTER_TURN,
}))

export const VOID_THRESHOLD: Placement = {
  piece: "floor_division",
  position: voidRoomPoint(0, 0, DOOR_LINE - DIVISION_HALF_DEPTH),
  rotationY: SAFE_ROOMS[VOID_ROOM].rotationY,
}

export const VOID_PLACEMENTS: Placement[] = [...VOID_FLOOR, VOID_THRESHOLD]

export const DARKNESS_AROUND_DOOR: DarknessPlane[] = [
  ...[-1, 1].map((side): DarknessPlane => ({
    center: [side * (ROOM_HALF_WIDTH + DARKNESS_REACH / 2), 0, BEHIND_EXTERIOR],
    size: [DARKNESS_REACH, 2 * DARKNESS_REACH],
  })),
  {
    center: [0, ROOM_HEIGHT + DARKNESS_REACH / 2, BEHIND_EXTERIOR],
    size: [2 * ROOM_HALF_WIDTH, DARKNESS_REACH],
  },
  {
    center: [0, -DARKNESS_REACH / 2, BEHIND_EXTERIOR],
    size: [2 * ROOM_HALF_WIDTH, DARKNESS_REACH],
  },
]

export const VOID_ROOM_MATRIX = fromVoidRoom

export const VOID_VOLUME = new Box3(
  new Vector3(-VOID_REACH, -VOID_REACH, -VOID_REACH),
  new Vector3(VOID_REACH, VOID_REACH, DOOR_LINE),
)

export const CREAK_SPOT = new Vector3(0, CREAK_HEIGHT, 0)
  .applyMatrix4(doorFrameMatrix(VOID_DOORWAY))
  .toArray()

export function voidRoomPoint(x: number, y: number, z: number): Vector3Tuple {
  return new Vector3(x, y, z).applyMatrix4(fromVoidRoom).toArray()
}

export function pastVoidDoor(point: Vector3) {
  return local.copy(point).applyMatrix4(intoVoidRoom).z < DOOR_LINE
}
