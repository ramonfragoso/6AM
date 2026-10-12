import { Euler, MathUtils, type Vector2 } from "three"

const LOOKING_STRAIGHT_UP = Math.PI / 2

const PITCH_MARGIN = 0.01

const PITCH_LIMIT = LOOKING_STRAIGHT_UP - PITCH_MARGIN

const YAW_FIRST = "YXZ"

export function createView() {
  return new Euler(0, 0, 0, YAW_FIRST)
}

export function turnView(view: Euler, look: Vector2) {
  view.y -= look.x
  view.x = MathUtils.clamp(view.x + look.y, -PITCH_LIMIT, PITCH_LIMIT)
}
