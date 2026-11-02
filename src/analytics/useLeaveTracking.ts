import { useEffect } from "react"
import { loadedShare } from "@/loading/loading"
import { title } from "@/title/title"
import { startAnalytics, trackLeaving } from "./analytics"
import { rounded } from "./rounded"
import { playProgress } from "./playProgress"

const MILLISECONDS = 1000

const PERCENT = 100

export function useLeaveTracking() {
  useEffect(() => {
    startAnalytics()
    let left = false
    const leave = () => {
      if (left) return
      left = true
      trackLeaving("game_left", leftAt())
    }
    window.addEventListener("pagehide", leave)
    return () => window.removeEventListener("pagehide", leave)
  }, [])
}

function leftAt() {
  const { playingSince, snapshot } = playProgress
  const now = performance.now() / MILLISECONDS
  return {
    stage: title.stage,
    loadedPercent: Math.round(loadedShare() * PERCENT),
    secondsOnPage: rounded(now),
    secondsPlayed: playingSince === null ? 0 : rounded(now - playingSince),
    ...snapshot?.(),
  }
}
