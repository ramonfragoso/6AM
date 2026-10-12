import { useCallback } from "react"
import { Vector2 } from "three"
import { readGamepad } from "@/input/gamepad"
import { readAxis, type InputAxis } from "@/input/inputAxis"
import { useHeldKeys } from "@/input/useHeldKeys"
import { useLookControls } from "./useLookControls"

const MAX_WALK_TILT = 1

const STRAFE: InputAxis = {
  negativeKeys: ["KeyA", "ArrowLeft"],
  positiveKeys: ["KeyD", "ArrowRight"],
  gamepad: (gamepad) => gamepad.leftStick.x,
}

const WALK: InputAxis = {
  negativeKeys: ["KeyS", "ArrowDown"],
  positiveKeys: ["KeyW", "ArrowUp"],
  gamepad: (gamepad) => gamepad.leftStick.y,
}

export type PlayerControls = {
  walk: Vector2
  look: Vector2
}

export const STANDING_STILL: PlayerControls = { walk: new Vector2(), look: new Vector2() }

export function usePlayerControls() {
  const heldKeys = useHeldKeys()
  const readLook = useLookControls()

  return useCallback(
    (delta: number): PlayerControls => {
      const gamepad = readGamepad()
      const keys = heldKeys.current
      const walk = new Vector2(readAxis(STRAFE, keys, gamepad), readAxis(WALK, keys, gamepad))
      return { walk: walk.clampLength(0, MAX_WALK_TILT), look: readLook(delta, keys, gamepad) }
    },
    [heldKeys, readLook],
  )
}
