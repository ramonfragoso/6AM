import { useFrame } from "@react-three/fiber"
import { manifestHaunt, nightClock, nightState } from "@/night/night"
import { loopState } from "@/passage/loopState"
import { playerPose } from "@/player/playerPose"
import { HAUNT_PRIORITY } from "@/world/physicsSettings"
import type { TriggerMoment } from "./haunts"
import { hauntState } from "./hauntState"

export function useHauntLife() {
  useFrame(() => {
    const { loop, phase } = nightState
    const { haunt } = loop
    if (!haunt || phase !== "playing") return
    const now = nightClock()
    const moment: TriggerMoment = {
      eye: playerPose.eye,
      yaw: playerPose.yaw,
      sinceChosen: now - loop.chosenAt,
    }
    if (loop.stage === "armed") {
      if (loopState.whereabouts !== "house" || !haunt.trigger?.(moment)) return
      manifestHaunt()
    }
    haunt.haunt?.(hauntState, { ...moment, sinceManifest: now - (loop.manifestedAt ?? now) })
  }, HAUNT_PRIORITY)
}
