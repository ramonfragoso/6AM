import type { GamepadState } from "./gamepad"

export type MenuButtons = { north: boolean; east: boolean; south: boolean }

export type Repeat = { direction: number; nextAt: number }

export const RELEASED_MENU_BUTTONS: MenuButtons = { north: false, east: false, south: false }

const STICK_PRESS = 0.5

const FIRST_REPEAT_MS = 400

const NEXT_REPEAT_MS = 110

export function menuButtonsOf(gamepad: GamepadState): MenuButtons {
  return {
    north: gamepad.pressed("north"),
    east: gamepad.pressed("east"),
    south: gamepad.pressed("south"),
  }
}

export function dpadVertical(gamepad: GamepadState) {
  return (gamepad.pressed("dpadDown") ? 1 : 0) - (gamepad.pressed("dpadUp") ? 1 : 0)
}

export function verticalOf(gamepad: GamepadState) {
  const dpad = dpadVertical(gamepad)
  if (dpad !== 0) return dpad
  return stickDirection(-gamepad.leftStick.y)
}

export function sidewaysOf(gamepad: GamepadState) {
  const dpad = (gamepad.pressed("dpadRight") ? 1 : 0) - (gamepad.pressed("dpadLeft") ? 1 : 0)
  if (dpad !== 0) return dpad
  return stickDirection(gamepad.leftStick.x)
}

export function repeatedPress(repeat: Repeat, direction: number, now: number) {
  if (direction === 0) {
    repeat.direction = 0
    return 0
  }
  if (direction !== repeat.direction) {
    repeat.direction = direction
    repeat.nextAt = now + FIRST_REPEAT_MS
    return direction
  }
  if (now < repeat.nextAt) return 0
  repeat.nextAt = now + NEXT_REPEAT_MS
  return direction
}

function stickDirection(tilt: number) {
  if (Math.abs(tilt) < STICK_PRESS) return 0
  return Math.sign(tilt)
}
