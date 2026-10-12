import { useCallback, useEffect, useRef } from "react"

export type PointerMovement = { x: number; y: number }

export function usePointerLockMovement(target: HTMLElement) {
  const movement = useRef<PointerMovement>({ x: 0, y: 0 })

  useEffect(() => {
    function lockPointer() {
      target.requestPointerLock().catch(ignoreRefusedLock)
    }

    function handleMouseMove(event: MouseEvent) {
      if (document.pointerLockElement !== target) return
      movement.current.x += event.movementX
      movement.current.y += event.movementY
    }

    target.addEventListener("click", lockPointer)
    document.addEventListener("mousemove", handleMouseMove)

    return () => {
      target.removeEventListener("click", lockPointer)
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [target])

  return useCallback((): PointerMovement => {
    const taken = { ...movement.current }
    movement.current.x = 0
    movement.current.y = 0
    return taken
  }, [])
}

function ignoreRefusedLock() {}
