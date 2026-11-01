import { useEffect, useState } from "react"
import { blackoutEvents } from "./blackoutEvents"

type BlackoutScreenState = { covered: boolean; seconds: number }

const UNCOVERED: BlackoutScreenState = { covered: false, seconds: 0 }

export function useBlackoutScreen() {
  const [screen, setScreen] = useState(UNCOVERED)

  useEffect(
    () =>
      blackoutEvents.listen(({ kind, seconds }) =>
        setScreen({ covered: kind === "fadeOut", seconds }),
      ),
    [],
  )

  return screen
}
