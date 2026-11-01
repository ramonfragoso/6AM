import { MathUtils, Vector3 } from "three"
import {
  type Doorway,
  doorFrameMatrix,
  type Room,
  roomAxes,
  roomOfDoorway,
} from "@/safeRoom/safeRooms"

export type DawnLightState = { doorway: Doorway | null; opened: number }

export type WhitenessSettings = { whiteFrom: number; whiteTo: number }

export const dawnLight: DawnLightState = { doorway: null, opened: 0 }

export function fillWithDawnLight(doorway: Doorway) {
  dawnLight.doorway = doorway
  dawnLight.opened = 0
}

export function clearDawnLight() {
  dawnLight.doorway = null
  dawnLight.opened = 0
}

export function lightFilledRoom(): Room | null {
  return dawnLight.doorway ? roomOfDoorway(dawnLight.doorway) : null
}

export function whitenessAt(eye: Vector3, doorway: Doorway, settings: WhitenessSettings) {
  const center = new Vector3().setFromMatrixPosition(doorFrameMatrix(doorway))
  const { inward } = roomAxes(roomOfDoorway(doorway))
  const pastDoorLine = eye.clone().sub(center).setY(0).dot(inward)
  return MathUtils.smoothstep(pastDoorLine, -settings.whiteFrom, settings.whiteTo)
}
