import { useThree } from "@react-three/fiber"
import { useCallback } from "react"
import { Vector2 } from "three"
import type { GamepadState } from "@/input/gamepad"
import { readAxis, type InputAxis } from "@/input/inputAxis"
import type { HeldKeys } from "@/input/useHeldKeys"
import { usePointerLockMovement } from "@/input/usePointerLockMovement"
import { usePlayerTuning } from "./usePlayerTuning"

const LOOK_SIDEWAYS: InputAxis = {
  negativeKeys: [],
  positiveKeys: [],
  gamepad: (gamepad) => gamepad.rightStick.x,
}

const LOOK_UPWARD: InputAxis = {
  negativeKeys: [],
  positiveKeys: [],
  gamepad: (gamepad) => gamepad.rightStick.y,
}

export function useLookControls() {
  const canvas = useThree((state) => state.gl.domElement)
  const takePointerMovement = usePointerLockMovement(canvas)
  const { stickLookSpeed, mouseSensitivity } = usePlayerTuning()

  return useCallback(
    (delta: number, keys: HeldKeys, gamepad: GamepadState) => {
      const pointer = takePointerMovement()
      const stickLook = stickLookSpeed * delta
      return new Vector2(
        readAxis(LOOK_SIDEWAYS, keys, gamepad) * stickLook + pointer.x * mouseSensitivity,
        readAxis(LOOK_UPWARD, keys, gamepad) * stickLook - pointer.y * mouseSensitivity,
      )
    },
    [takePointerMovement, stickLookSpeed, mouseSensitivity],
  )
}
