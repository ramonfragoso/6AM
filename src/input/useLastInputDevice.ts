import { useCallback, useEffect, useRef } from "react"
import { type GamepadFamily, type GamepadState, gamepadTouched } from "./gamepad"

export type InputDevice = "mouse" | GamepadFamily

export function useLastInputDevice() {
  const device = useRef<InputDevice>("mouse")

  useEffect(() => {
    function pickMouse() {
      device.current = "mouse"
    }

    window.addEventListener("keydown", pickMouse)
    window.addEventListener("mousedown", pickMouse)
    window.addEventListener("mousemove", pickMouse)

    return () => {
      window.removeEventListener("keydown", pickMouse)
      window.removeEventListener("mousedown", pickMouse)
      window.removeEventListener("mousemove", pickMouse)
    }
  }, [])

  return useCallback((gamepad: GamepadState): InputDevice => {
    if (gamepad.family && gamepadTouched(gamepad)) device.current = gamepad.family
    return device.current
  }, [])
}
