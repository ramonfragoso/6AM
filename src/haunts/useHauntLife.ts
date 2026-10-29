import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import type { Vector3 } from "three"
import { type CurrentLoop, manifestHaunt, nightState } from "@/night/night"
import { nightClock } from "@/night/nightClock"
import { loopState } from "@/passage/loopState"
import { playerPose } from "@/player/playerPose"
import { stepEvents } from "@/steps/stepEvents"
import { HAUNT_PRIORITY } from "@/world/physicsSettings"
import type { TriggerMoment } from "./haunts"
import { hauntState } from "./hauntState"

type LoopSteps = { loop: CurrentLoop | null; steps: Vector3[] }

export function useHauntLife() {
  const loopSteps = useLoopSteps()

  useFrame(() => {
    const { loop, phase } = nightState
    const { haunt } = loop
    if (!haunt || phase !== "playing") return
    const now = nightClock()
    const moment: TriggerMoment = {
      eye: playerPose.eye,
      yaw: playerPose.yaw,
      sinceChosen: now - loop.chosenAt,
      steps: stepsOf(loopSteps.current, loop),
    }
    if (loop.stage === "armed") {
      if (loopState.whereabouts !== "house" || !haunt.trigger?.(moment)) return
      manifestHaunt()
    }
    haunt.haunt?.(hauntState, { ...moment, sinceManifest: now - (loop.manifestedAt ?? now) })
  }, HAUNT_PRIORITY)
}

function useLoopSteps() {
  const loopSteps = useRef<LoopSteps>({ loop: null, steps: [] })
  useEffect(
    () =>
      stepEvents.listen(() => {
        stepsOf(loopSteps.current, nightState.loop).push(playerPose.eye.clone())
      }),
    [],
  )
  return loopSteps
}

function stepsOf(loopSteps: LoopSteps, loop: CurrentLoop) {
  if (loopSteps.loop !== loop) Object.assign(loopSteps, { loop, steps: [] })
  return loopSteps.steps
}
