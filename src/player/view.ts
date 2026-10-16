import { Euler, MathUtils, type Vector2 } from "three"

const LOOKING_STRAIGHT_UP = Math.PI / 2

const PITCH_MARGIN = 0.01

const PITCH_LIMIT = LOOKING_STRAIGHT_UP - PITCH_MARGIN

const YAW_FIRST = "YXZ"

export function createView(yaw = 0) {
  return new Euler(0, yaw, 0, YAW_FIRST)
}

export function lookAlong(view: Euler, pitch: number, yaw: number) {
  view.set(pitch, yaw, 0, YAW_FIRST)
}

export function turnView(view: Euler, look: Vector2) {
  view.y -= look.x
  view.x = MathUtils.clamp(view.x + look.y, -PITCH_LIMIT, PITCH_LIMIT)
}
