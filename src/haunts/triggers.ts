import type { Vector3 } from "three"
import { SECOND_CORRIDOR_START_Z } from "@/kit/corridorLayout"
import { CORNER_START_X, HOUSE_DOORS } from "@/kit/house"
import { placedCoatRack } from "@/props/coatRack"
import { voidSettings } from "@/void/voidSettings"
import type { Trigger } from "./haunts"

type Region = (point: Vector3) => boolean

export function pastX(x: number): Trigger {
  return ({ eye }) => eye.x >= x
}

export function within(point: Vector3, distance: number): Trigger {
  return ({ eye }) => Math.hypot(eye.x - point.x, eye.z - point.z) <= distance
}

export function stepsIn(region: Region, count: number): Trigger {
  return ({ steps }) => steps.filter(region).length >= count
}

export function inSecondCorridor(point: Vector3) {
  return point.x >= CORNER_START_X && point.z >= SECOND_CORRIDOR_START_Z
}

export const reachedCorner = pastX(CORNER_START_X)

export const besideCoatRack: Trigger = ({ eye }) => eye.z >= placedCoatRack.z

const CRUCIFIX_DOOR_Z = HOUSE_DOORS.end.position[2]

export const nearCrucifixDoor: Trigger = ({ eye }) =>
  inSecondCorridor(eye) && eye.z >= CRUCIFIX_DOOR_Z - voidSettings.triggerDistance
