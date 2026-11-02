import { nightSession, nightState } from "@/night/night"
import { nightClock } from "@/night/nightClock"
import { gameSettings } from "@/settings/gameSettings"
import { rounded } from "./rounded"

export type GraphicsBackend = "webgpu" | "webgl"

export function gameStarted(backend: GraphicsBackend) {
  return {
    backend,
    quality: gameSettings.quality,
    bloom: gameSettings.bloom,
    depthOfField: gameSettings.depthOfField,
    screen: `${window.screen.width}x${window.screen.height}`,
    devicePixelRatio: window.devicePixelRatio,
  }
}

export function loopEnded(playingSince: number) {
  const { loop, loops } = nightState
  const record = loops.at(-1)
  return {
    night: nightState.night,
    hour: loop.hour,
    loop: loop.number,
    outcome: loop.outcome,
    haunt: loop.haunt?.name ?? null,
    manifested: record?.manifested ?? false,
    way: record?.way ?? null,
    passed: record?.passed ?? false,
    forced: loop.forced,
    seconds: rounded(nightClock() - Math.max(loop.chosenAt, playingSince)),
  }
}

export function dawnReached(nightStartedAt: number) {
  return {
    night: nightState.night,
    loops: nightState.loops.length,
    failedLoops: nightState.loops.filter((loop) => !loop.passed).length,
    hauntsCaught: nightSession.caught.size,
    nightsWon: nightSession.nightsWon,
    seconds: rounded(nightClock() - nightStartedAt),
  }
}

export function nightStarted() {
  return { night: nightState.night, nightsWon: nightSession.nightsWon }
}

export function nightProgress() {
  const { loop } = nightState
  return {
    night: nightState.night,
    nightPhase: nightState.phase,
    hour: nightState.hour,
    loop: loop.number,
    loopHaunt: loop.haunt?.name ?? null,
    loopsEnded: nightSession.loopsEnded,
    nightsWon: nightSession.nightsWon,
    hauntsCaught: nightSession.caught.size,
  }
}
