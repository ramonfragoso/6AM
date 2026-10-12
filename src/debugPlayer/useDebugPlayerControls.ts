import { useCallback } from "react"
import { Vector2, Vector3 } from "three"
import { readGamepad } from "@/input/gamepad"
import { readAxis, type InputAxis } from "@/input/inputAxis"
import { useHeldKeys } from "@/input/useHeldKeys"
import { useLookControls } from "@/player/useLookControls"

const MAX_FLY_TILT = 1

const STRAFE: InputAxis = {
  negativeKeys: ["KeyA", "ArrowLeft"],
  positiveKeys: ["KeyD", "ArrowRight"],
  gamepad: (gamepad) => gamepad.leftStick.x,
}

const FLY_FORWARD: InputAxis = {
  negativeKeys: ["KeyS", "ArrowDown"],
  positiveKeys: ["KeyW", "ArrowUp"],
  gamepad: (gamepad) => gamepad.leftStick.y,
}

const RISE: InputAxis = {
  negativeKeys: ["ShiftLeft", "KeyQ"],
  positiveKeys: ["Space", "KeyE"],
  gamepad: (gamepad) => gamepad.rightTrigger - gamepad.leftTrigger,
}

export type DebugPlayerControls = {
  fly: Vector3
  look: Vector2
}

export function useDebugPlayerControls() {
  const heldKeys = useHeldKeys()
  const readLook = useLookControls()

  return useCallback(
    (delta: number): DebugPlayerControls => {
      const gamepad = readGamepad()
      const keys = heldKeys.current
      const fly = new Vector3(
        readAxis(STRAFE, keys, gamepad),
        readAxis(RISE, keys, gamepad),
        readAxis(FLY_FORWARD, keys, gamepad),
      )
      return { fly: fly.clampLength(0, MAX_FLY_TILT), look: readLook(delta, keys, gamepad) }
    },
    [heldKeys, readLook],
  )
}
