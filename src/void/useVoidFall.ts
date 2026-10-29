import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { endLoop, nightState } from "@/night/night"
import { nightClock } from "@/night/nightClock"
import { nightEvents } from "@/night/nightEvents"
import { loopState } from "@/passage/loopState"
import { playerPose } from "@/player/playerPose"
import { fadeAllSound } from "@/sound/audioEngine"
import { FURNISH_PRIORITY } from "@/world/physicsSettings"
import { voidEvents } from "./voidEvents"
import { voidOpen } from "./voidOpen"
import { voidSettings } from "./voidSettings"

type Fall = { since: number; faded: boolean }

const FLOOR_LEVEL = 0

const SILENT = 0

const FULL_VOLUME = 1

export function useVoidFall() {
  const fall = useRef<Fall | null>(null)

  useEffect(
    () =>
      nightEvents.listen((event) => {
        if (event.kind === "newNight") fall.current = null
      }),
    [],
  )

  useFrame(() => {
    const now = nightClock()
    const falling = fall.current
    if (!falling) {
      if (startsFalling()) fall.current = { since: now, faded: false }
      return
    }
    const { fallSeconds, fadeOut, blackSeconds, fadeIn } = voidSettings
    const seconds = now - falling.since
    if (!falling.faded && seconds >= fallSeconds) {
      falling.faded = true
      fadeAllSound(SILENT, fadeOut)
      voidEvents.emit({ kind: "fadeOut", seconds: fadeOut })
    }
    if (seconds < fallSeconds + fadeOut + blackSeconds) return
    fall.current = null
    endLoop("down")
    fadeAllSound(FULL_VOLUME, fadeIn)
    voidEvents.emit({ kind: "fadeIn", seconds: fadeIn })
  }, FURNISH_PRIORITY)
}

function startsFalling() {
  return (
    voidOpen() &&
    nightState.phase === "playing" &&
    loopState.whereabouts === "house" &&
    !loopState.passing &&
    playerPose.eye.y < FLOOR_LEVEL
  )
}
