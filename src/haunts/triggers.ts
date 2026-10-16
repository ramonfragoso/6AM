import type { Vector3 } from "three"
import { CORNER_START_X } from "@/kit/house"
import type { Trigger } from "./haunts"

export function pastX(x: number): Trigger {
  return ({ eye }) => eye.x >= x
}

export function within(point: Vector3, distance: number): Trigger {
  return ({ eye }) => Math.hypot(eye.x - point.x, eye.z - point.z) <= distance
}

export const reachedCorner = pastX(CORNER_START_X)
