import { useEffect, useRef } from "react"
import { showTitle } from "@/title/title"
import { downloadGameAssets, type GameAsset } from "./downloads"
import { loadedShare, loadingDone } from "./loading"

export type LoadingScreenParts = ReturnType<typeof useLoadingScreenParts>

const CATCH_UP_RATE = 6

const SNAP_DISTANCE = 0.002

const PERCENT = 100

const MILLISECONDS = 1000

export const METER_FADE_SECONDS = 0.6

export const SCREEN_FADE_SECONDS = 1.5

const PAUSE_AT_FULL_SECONDS = 0.3

export function useLoadingScreen(assets: readonly GameAsset[]) {
  const parts = useLoadingScreenParts()

  useEffect(() => downloadGameAssets(assets), [assets])

  useEffect(() => {
    let frame = 0
    let shown = 0
    let shownPercent = 0
    let last = performance.now()
    let fullSince: number | null = null
    const draw = (now: number) => {
      const delta = (now - last) / MILLISECONDS
      last = now
      shown = approach(shown, loadingDone() ? 1 : loadedShare(), delta)
      const percent = Math.floor(shown * PERCENT)
      if (percent !== shownPercent && parts.percent.current) {
        parts.percent.current.textContent = `${percent}%`
        shownPercent = percent
      }
      if (parts.fill.current) parts.fill.current.style.transform = `scaleX(${shown})`
      if (shown === 1) fullSince ??= now
      if (fullSince !== null && now - fullSince >= PAUSE_AT_FULL_SECONDS * MILLISECONDS) {
        leave(parts)
        return
      }
      frame = window.requestAnimationFrame(draw)
    }
    frame = window.requestAnimationFrame(draw)
    return () => window.cancelAnimationFrame(frame)
  }, [parts])

  return parts
}

function useLoadingScreenParts() {
  const screen = useRef<HTMLDivElement>(null)
  const meter = useRef<HTMLDivElement>(null)
  const percent = useRef<HTMLParagraphElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const parts = useRef({
    screen,
    meter,
    percent,
    fill,
  })
  return parts.current
}

function approach(shown: number, target: number, delta: number) {
  const eased = shown + (target - shown) * (1 - Math.exp(-CATCH_UP_RATE * delta))
  const next = target - eased < SNAP_DISTANCE ? target : eased
  return Math.max(shown, next)
}

function leave(parts: LoadingScreenParts) {
  if (parts.meter.current) parts.meter.current.style.opacity = "0"
  window.setTimeout(() => {
    if (parts.screen.current) parts.screen.current.style.opacity = "0"
    window.setTimeout(() => {
      hide(parts)
      showTitle()
    }, SCREEN_FADE_SECONDS * MILLISECONDS)
  }, METER_FADE_SECONDS * MILLISECONDS)
}

function hide(parts: LoadingScreenParts) {
  const screen = parts.screen.current
  if (!screen) return
  screen.style.visibility = "hidden"
  screen.style.pointerEvents = "none"
}
