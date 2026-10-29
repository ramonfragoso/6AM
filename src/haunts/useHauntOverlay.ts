import { useCallback, useEffect, useState } from "react"
import { forceLoopOnce, nightState } from "@/night/night"
import { hauntOverlayToggle } from "./hauntOverlayToggle"
import { type HauntOverlayView, hauntOverlayView } from "./hauntOverlayView"

const REFRESH_MILLISECONDS = 250

export function useHauntOverlay() {
  const [view, setView] = useState<HauntOverlayView | null>(null)
  const refresh = useCallback(
    () => setView(hauntOverlayToggle.shown ? hauntOverlayView(nightState) : null),
    [],
  )

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, REFRESH_MILLISECONDS)
    return () => window.clearInterval(timer)
  }, [refresh])

  const force = useCallback(
    (choice: string) => {
      forceLoopOnce(choice)
      refresh()
    },
    [refresh],
  )

  return { view, force }
}
