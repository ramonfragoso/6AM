import type { Vector3Tuple } from "three"
import { DOOR_LINE } from "@/safeRoom/safeRooms"
import { voidRoomPoint } from "./voidSpace"

const DEGREES = Math.PI / 180

const FLOOR_LEVEL = 0

export type VoidLightSettings = {
  intensity: number
  color: string
  across: number
  along: number
  height: number
  aimAlong: number
  angle: number
  penumbra: number
  distance: number
  decay: number
}

export type VoidLightAim = { position: Vector3Tuple; target: Vector3Tuple; angle: number }

export function voidLightAim({
  across,
  along,
  height,
  aimAlong,
  angle,
}: VoidLightSettings): VoidLightAim {
  return {
    position: voidRoomPoint(across, height, DOOR_LINE - along),
    target: voidRoomPoint(across, FLOOR_LEVEL, DOOR_LINE - aimAlong),
    angle: angle * DEGREES,
  }
}
