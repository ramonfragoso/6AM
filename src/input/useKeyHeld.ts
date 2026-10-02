import { useEffect, useRef, type RefObject } from "react"

export function useKeyHeld(code: string): RefObject<boolean> {
  const held = useRef(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === code) held.current = true
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === code) held.current = false
    }

    function release() {
      held.current = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", release)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", release)
    }
  }, [code])

  return held
}
