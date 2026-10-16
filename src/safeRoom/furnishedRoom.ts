import { Matrix4, Quaternion, Vector3, type Vector3Tuple } from "three"
import { loopState } from "@/passage/loopState"
import { HALF_TURN, type Room, ROOMS, roomMatrix } from "./safeRooms"

type RoomTurns = { upright: Matrix4; turned: Matrix4 }

const FURNISHED_ROOMS = Object.fromEntries(
  ROOMS.map((room) => [
    room,
    { upright: roomMatrix(room), turned: roomMatrix(room).multiply(HALF_TURN) },
  ]),
) as Record<Room, RoomTurns>

export type FurnishedPose = {
  position: Vector3Tuple
  quaternion: [x: number, y: number, z: number, w: number]
}

export function furnishedRoomMatrix() {
  const { upright, turned } = FURNISHED_ROOMS[loopState.lampRoom]
  return loopState.whereabouts === "house" ? turned : upright
}

export function furnishedPose(local: Matrix4, target = new Matrix4()): FurnishedPose {
  const position = new Vector3()
  const quaternion = new Quaternion()
  target
    .multiplyMatrices(furnishedRoomMatrix(), local)
    .decompose(position, quaternion, new Vector3())
  return {
    position: position.toArray(),
    quaternion: quaternion.toArray() as FurnishedPose["quaternion"],
  }
}
