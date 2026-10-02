const STANDARD_MAPPING = "standard"

const STICK_DEADZONE = 0.15

const TRIGGER_DEADZONE = 0.05

const RELEASED_TRIGGER_AXIS = -1

const UNTOUCHED_TRIGGER_AXIS = 0

export type GamepadButton =
  | "south"
  | "east"
  | "west"
  | "north"
  | "leftBumper"
  | "rightBumper"
  | "select"
  | "start"
  | "leftStickPress"
  | "rightStickPress"
  | "dpadUp"
  | "dpadDown"
  | "dpadLeft"
  | "dpadRight"

export type Stick = { x: number; y: number }

export type GamepadState = {
  leftStick: Stick
  rightStick: Stick
  leftTrigger: number
  rightTrigger: number
  pressed: (button: GamepadButton) => boolean
}

type TriggerReader = (gamepad: Gamepad) => number

type StickAxes = { x: number; y: number }

type GamepadLayout = {
  leftStick: StickAxes
  rightStick: StickAxes
  leftTrigger: TriggerReader
  rightTrigger: TriggerReader
}

const BUTTON_INDEX: Record<GamepadButton, number> = {
  south: 0,
  east: 1,
  west: 2,
  north: 3,
  leftBumper: 4,
  rightBumper: 5,
  select: 8,
  start: 9,
  leftStickPress: 10,
  rightStickPress: 11,
  dpadUp: 12,
  dpadDown: 13,
  dpadLeft: 14,
  dpadRight: 15,
}

const STANDARD_LAYOUT: GamepadLayout = {
  leftStick: { x: 0, y: 1 },
  rightStick: { x: 2, y: 3 },
  leftTrigger: buttonTrigger(6),
  rightTrigger: buttonTrigger(7),
}

const UNMAPPED_LAYOUT: GamepadLayout = {
  leftStick: { x: 0, y: 1 },
  rightStick: { x: 3, y: 4 },
  leftTrigger: axisTrigger(2),
  rightTrigger: axisTrigger(5),
}

const CENTERED: Stick = { x: 0, y: 0 }

const DISCONNECTED: GamepadState = {
  leftStick: CENTERED,
  rightStick: CENTERED,
  leftTrigger: 0,
  rightTrigger: 0,
  pressed: () => false,
}

export function readGamepad(): GamepadState {
  const gamepad = firstConnectedGamepad()
  if (!gamepad) return DISCONNECTED

  const layout = layoutOf(gamepad)
  return {
    leftStick: readStick(gamepad, layout.leftStick),
    rightStick: readStick(gamepad, layout.rightStick),
    leftTrigger: withDeadzone(layout.leftTrigger(gamepad), TRIGGER_DEADZONE),
    rightTrigger: withDeadzone(layout.rightTrigger(gamepad), TRIGGER_DEADZONE),
    pressed: (button) => isPressed(gamepad, BUTTON_INDEX[button]),
  }
}

function readStick(gamepad: Gamepad, axes: StickAxes): Stick {
  const x = gamepad.axes[axes.x] ?? 0
  const downward = gamepad.axes[axes.y] ?? 0
  return { x: withDeadzone(x, STICK_DEADZONE), y: -withDeadzone(downward, STICK_DEADZONE) }
}

function isPressed(gamepad: Gamepad, buttonIndex: number) {
  return gamepad.buttons[buttonIndex]?.pressed ?? false
}

function firstConnectedGamepad() {
  if (!("getGamepads" in navigator)) return null
  return navigator.getGamepads().find((gamepad) => gamepad?.connected) ?? null
}

function layoutOf(gamepad: Gamepad) {
  return gamepad.mapping === STANDARD_MAPPING ? STANDARD_LAYOUT : UNMAPPED_LAYOUT
}

function buttonTrigger(buttonIndex: number): TriggerReader {
  return (gamepad) => gamepad.buttons[buttonIndex]?.value ?? 0
}

function axisTrigger(axisIndex: number): TriggerReader {
  return (gamepad) => {
    const axis = gamepad.axes[axisIndex] ?? RELEASED_TRIGGER_AXIS
    if (axis === UNTOUCHED_TRIGGER_AXIS) return 0
    return (axis + 1) / 2
  }
}

function withDeadzone(value: number, deadzone: number) {
  const magnitude = Math.abs(value)
  if (magnitude <= deadzone) return 0
  return (Math.sign(value) * (magnitude - deadzone)) / (1 - deadzone)
}
