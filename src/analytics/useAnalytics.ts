import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { nightEvents } from "@/night/nightEvents"
import { nightClock } from "@/night/nightClock"
import { nightState } from "@/night/night"
import { gameSettings } from "@/settings/gameSettings"
import { playing, titleEvents } from "@/title/title"
import { track } from "./analytics"
import {
  dawnReached,
  gameStarted,
  type GraphicsBackend,
  loopEnded,
  nightProgress,
  nightStarted,
} from "./gameEvents"
import { playProgress } from "./playProgress"
import { rounded } from "./rounded"

const SAMPLE_FROM_SECONDS = 10

const SAMPLE_UNTIL_SECONDS = 40

const MILLISECONDS = 1000

const SLOW_FRAME_SECONDS = 1 / 30

type BackendRenderer = { backend?: { isWebGPUBackend?: boolean } }

type FrameSample = {
  since: number | null
  frames: number
  seconds: number
  slow: number
  sent: boolean
}

export function useAnalytics() {
  const renderer = useThree((state) => state.gl)
  const backend = backendOf(renderer as unknown as BackendRenderer)
  const nightStartedAt = useRef(nightClock())

  useEffect(() => {
    playProgress.snapshot = nightProgress
    const stopTitle = titleEvents.listen((stage) => {
      if (stage === "shown") track("loading_finished", { seconds: rounded(nightClock()) })
      if (stage !== "playing") return
      nightStartedAt.current = nightClock()
      playProgress.playingSince = nightClock()
      track("game_started", gameStarted(backend))
    })
    const stopNight = nightEvents.listen((event) => {
      if (event.kind === "verdict") track("loop_ended", loopEnded(nightStartedAt.current))
      if (event.kind === "dawn") track("dawn", dawnReached(nightStartedAt.current))
      if (event.kind === "newNight") {
        nightStartedAt.current = nightClock()
        track("night_started", nightStarted())
      }
    })
    return () => {
      stopTitle()
      stopNight()
    }
  }, [backend])

  useFrameSample(backend)
}

function useFrameSample(backend: GraphicsBackend) {
  const sample = useRef<FrameSample>({
    since: null,
    frames: 0,
    seconds: 0,
    slow: 0,
    sent: false,
  })
  const renderer = useThree((state) => state.gl)

  useFrame((_, delta) => {
    const current = sample.current
    if (current.sent || !playing() || nightState.phase !== "playing") return
    current.since ??= nightClock()
    const elapsed = nightClock() - current.since
    if (elapsed < SAMPLE_FROM_SECONDS) return
    current.frames += 1
    current.seconds += delta
    if (delta > SLOW_FRAME_SECONDS) current.slow += 1
    if (elapsed < SAMPLE_UNTIL_SECONDS) return
    current.sent = true
    track("performance", {
      backend,
      quality: gameSettings.quality,
      pixelRatio: renderer.getPixelRatio(),
      frameMs: rounded((current.seconds / current.frames) * MILLISECONDS),
      fps: rounded(current.frames / current.seconds),
      slowFrameShare: rounded(current.slow / current.frames),
    })
  })
}

function backendOf(renderer: BackendRenderer): GraphicsBackend {
  return renderer.backend?.isWebGPUBackend ? "webgpu" : "webgl"
}
