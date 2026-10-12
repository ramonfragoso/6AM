import { useEffect, useRef, type RefObject } from "react"

export type HeldKeys = ReadonlySet<string>

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

    function releaseAll() {
      keys.clear()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", releaseAll)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", releaseAll)
    }
  }, [])

  return held
}
