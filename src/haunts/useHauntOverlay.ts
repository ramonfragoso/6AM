import { useEffect, useState } from "react"
import { nightState } from "@/night/night"
import { hauntOverlayToggle } from "./hauntOverlayToggle"
import { type HauntOverlayView, hauntOverlayView } from "./hauntOverlayView"

const REFRESH_MILLISECONDS = 250

export function useHauntOverlay() {
  const [view, setView] = useState<HauntOverlayView | null>(null)

  useEffect(() => {
    const refresh = () => setView(hauntOverlayToggle.shown ? hauntOverlayView(nightState) : null)
    refresh()
    const timer = window.setInterval(refresh, REFRESH_MILLISECONDS)
    return () => window.clearInterval(timer)
  }, [])

  return view
}
