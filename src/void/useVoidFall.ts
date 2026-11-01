import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { advanceBlackout, type Blackout, startBlackout } from "@/blackout/blackout"
import { endLoop, nightState } from "@/night/night"
import { nightClock } from "@/night/nightClock"
import { nightEvents } from "@/night/nightEvents"
import { loopState } from "@/passage/loopState"
import { playerPose } from "@/player/playerPose"
import { FURNISH_PRIORITY } from "@/world/physicsSettings"
import { voidOpen } from "./voidOpen"
import { voidSettings } from "./voidSettings"

const FLOOR_LEVEL = 0

export function useVoidFall() {
  const fall = useRef<Blackout | null>(null)

  useEffect(
    () =>
      nightEvents.listen((event) => {
        if (event.kind === "newNight") fall.current = null
      }),
    [],
  )

  useFrame(() => {
    const now = nightClock()
    if (!fall.current) {
      if (startsFalling()) fall.current = startBlackout(now)
      return
    }
    const { fallSeconds, fadeOut, blackSeconds, fadeIn } = voidSettings
    const timing = {
      before: fallSeconds,
      fadeOut,
      soundOut: fadeOut,
      black: blackSeconds,
      fadeIn,
    }
    if (!advanceBlackout(fall.current, now, timing)) return
    fall.current = null
    endLoop("down")
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
