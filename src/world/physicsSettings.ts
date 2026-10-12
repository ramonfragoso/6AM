import type { Vector3Tuple } from "three"

export const PHYSICS_TIME_STEP = 1 / 60

export const GRAVITY: Vector3Tuple = [0, -9.81, 0]

export const READ_INPUT_PRIORITY = -2

export const PHYSICS_STEP_PRIORITY = -1
