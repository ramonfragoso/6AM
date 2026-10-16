import { Vector3, type Vector3Tuple } from "three"
import { DOOR_LINE, roomAxes, roomMatrix } from "@/safeRoom/safeRooms"
import { yawAlong } from "./passage"
import { DEFAULT_THROUGH } from "./usePassageTuning"

export type Spawn = { feet: Vector3Tuple; yaw: number }

export function startRoomSpawn(): Spawn {
  const feet = new Vector3(0, 0, DEFAULT_THROUGH - DOOR_LINE).applyMatrix4(roomMatrix("start"))
  return { feet: feet.toArray(), yaw: yawAlong(roomAxes("start").inward.negate()) }
}
