import { useCallback } from "react"
import { readGamepad } from "@/input/gamepad"
import { readAxis, type InputAxis } from "@/input/inputAxis"
import { MOUSE_PRIMARY, useHeldKeys } from "@/input/useHeldKeys"

const ZOOM: InputAxis = {
  negativeKeys: [],
  positiveKeys: ["KeyP", MOUSE_PRIMARY],
  gamepad: (gamepad) => (gamepad.pressed("west") ? 1 : 0),
}

export function useZoomControls() {
  const heldKeys = useHeldKeys()

  return useCallback(() => readAxis(ZOOM, heldKeys.current, readGamepad()) > 0, [heldKeys])
}
