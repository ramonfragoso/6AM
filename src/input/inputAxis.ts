import { MathUtils } from "three"
import type { GamepadState } from "./gamepad"
import type { HeldKeys } from "./useHeldKeys"

const FULL_TILT = 1

export type InputAxis = {
  negativeKeys: readonly string[]
  positiveKeys: readonly string[]
  gamepad: (gamepad: GamepadState) => number
}

export function readAxis(axis: InputAxis, heldKeys: HeldKeys, gamepad: GamepadState) {
  const keyboard = keyTilt(axis.positiveKeys, heldKeys) - keyTilt(axis.negativeKeys, heldKeys)
  return MathUtils.clamp(keyboard + axis.gamepad(gamepad), -FULL_TILT, FULL_TILT)
}

function keyTilt(keys: readonly string[], heldKeys: HeldKeys) {
  return keys.some((key) => heldKeys.has(key)) ? FULL_TILT : 0
}
