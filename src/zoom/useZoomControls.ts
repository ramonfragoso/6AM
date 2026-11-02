import { useCallback } from "react"
import { readGamepad } from "@/input/gamepad"
import { readAxis, type InputAxis } from "@/input/inputAxis"
import { MOUSE_PRIMARY, useHeldKeys } from "@/input/useHeldKeys"

const TRIGGER_HELD = 0.5

const ZOOM: InputAxis = {
  negativeKeys: [],
  positiveKeys: ["KeyP", MOUSE_PRIMARY],
  gamepad: (gamepad) => (gamepad.rightTrigger >= TRIGGER_HELD ? 1 : 0),
}

export function useZoomControls() {
  const heldKeys = useHeldKeys()

  return useCallback(() => readAxis(ZOOM, heldKeys.current, readGamepad()) > 0, [heldKeys])
}
