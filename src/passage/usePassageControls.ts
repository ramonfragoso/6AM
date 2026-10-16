import { useCallback, useRef } from "react"
import { readGamepad } from "@/input/gamepad"
import { readAxis, type InputAxis } from "@/input/inputAxis"
import { useHeldKeys } from "@/input/useHeldKeys"

const OPEN: InputAxis = {
  negativeKeys: [],
  positiveKeys: ["KeyE"],
  gamepad: (gamepad) => (gamepad.pressed("south") ? 1 : 0),
}

const PRESSED = 0.5

export function usePassageControls() {
  const heldKeys = useHeldKeys()
  const wasHeld = useRef(false)

  return useCallback(() => {
    const held = readAxis(OPEN, heldKeys.current, readGamepad()) > PRESSED
    const pressedNow = held && !wasHeld.current
    wasHeld.current = held
    return { open: pressedNow }
  }, [heldKeys])
}
