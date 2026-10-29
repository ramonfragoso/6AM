import { type Matrix4, Vector3 } from "three"
import { forwardOf } from "@/passage/passage"

export const DOOR_SLAM_SOUND_AT = 0.057

const GAP_ALONG = -0.75

const GAP_HEIGHT = 1.5

const DEGREES = Math.PI / 180

const toGap = new Vector3()

export type DoorAjar = { chosenAt: number }

export type AjarSettings = {
  angle: number
  reach: number
  facing: number
  flicker: number
  flickerSeconds: number
}

export function newDoorAjar(chosenAt: number): DoorAjar {
  return { chosenAt }
}

export function gapOf(frame: Matrix4) {
  return new Vector3(GAP_ALONG, GAP_HEIGHT, 0).applyMatrix4(frame)
}

export function looksAtGap(
  eye: Vector3,
  yaw: number,
  gap: Vector3,
  { reach, facing }: AjarSettings,
) {
  toGap.set(gap.x - eye.x, 0, gap.z - eye.z)
  if (toGap.length() > reach) return false
  return forwardOf(yaw).angleTo(toGap) <= facing * DEGREES
}
