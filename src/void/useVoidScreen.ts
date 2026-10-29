import { useEffect, useState } from "react"
import { voidEvents } from "./voidEvents"

type VoidScreenState = { covered: boolean; seconds: number }

const UNCOVERED: VoidScreenState = { covered: false, seconds: 0 }

export function useVoidScreen() {
  const [screen, setScreen] = useState(UNCOVERED)

  useEffect(
    () =>
      voidEvents.listen(({ kind, seconds }) => setScreen({ covered: kind === "fadeOut", seconds })),
    [],
  )

  return screen
}
