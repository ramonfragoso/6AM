import { useEffect, useRef, type RefObject } from "react"

export type HeldKeys = ReadonlySet<string>

export const MOUSE_PRIMARY = "MousePrimary"

const PRIMARY_BUTTON = 0

export function useHeldKeys(): RefObject<HeldKeys> {
  const held = useRef(new Set<string>())

  useEffect(() => {
    const keys = held.current

    function handleKeyDown(event: KeyboardEvent) {
      keys.add(event.code)
    }

    function handleKeyUp(event: KeyboardEvent) {
      keys.delete(event.code)
    }

    function handleMouseDown(event: MouseEvent) {
      if (event.button === PRIMARY_BUTTON && document.pointerLockElement) keys.add(MOUSE_PRIMARY)
    }

    function handleMouseUp(event: MouseEvent) {
      if (event.button === PRIMARY_BUTTON) keys.delete(MOUSE_PRIMARY)
    }

    function releaseAll() {
      keys.clear()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("blur", releaseAll)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("blur", releaseAll)
    }
  }, [])

  return held
}
