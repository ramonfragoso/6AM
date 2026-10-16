import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { Matrix4, type Object3D } from "three"
import { handAngle, type Hand, HANDS } from "./clock"
import { type ClockEvent, clockEvents } from "./clockEvents"
import { type ClockFace, clockFace, clockTime, runClock, sameFace } from "./clockTime"
import type { ClockHand } from "./useClockModel"

type HandObjects = Partial<Record<Hand, Object3D>>

const turn = new Matrix4()

export function useClockHands(hands: Record<Hand, ClockHand>) {
  const objects = useRef<HandObjects>({})
  const shownFace = useRef<ClockFace | null>(null)
  const shownRestart = useRef(clockTime.restarts)

  useFrame((_, delta) => {
    runClock(delta)
    const face = clockFace()
    const shown = shownFace.current
    const restarted = shownRestart.current !== clockTime.restarts
    shownRestart.current = clockTime.restarts
    if (shown && sameFace(shown, face)) return
    shownFace.current = face
    for (const hand of HANDS) {
      const object = objects.current[hand]
      if (!object) continue
      object.matrix.copy(hands[hand].anchor).multiply(turn.makeRotationZ(handAngle(hand, face)))
      object.matrixWorldNeedsUpdate = true
    }
    if (shown && !restarted) for (const event of faceEvents(shown, face)) clockEvents.emit(event)
  })

  return useMemo(
    () =>
      Object.fromEntries(
        HANDS.map((hand) => [
          hand,
          (object: Object3D | null) => {
            if (object) objects.current[hand] = object
            else delete objects.current[hand]
            shownFace.current = null
          },
        ]),
      ) as Record<Hand, (object: Object3D | null) => void>,
    [],
  )
}

function faceEvents(before: ClockFace, after: ClockFace): ClockEvent[] {
  if (before.phase !== after.phase) {
    if (after.phase === "stalled") return [{ kind: "stall" }]
    if (after.phase === "glitch") return [{ kind: "glitchStart" }, ...glitchSteps(before, after)]
    return [{ kind: "reset" }]
  }
  if (after.phase === "glitch") return glitchSteps(before, after)
  if (after.phase === "counting" && before.second !== after.second) {
    return [{ kind: "tick", second: after.second }]
  }
  return []
}

function glitchSteps(before: ClockFace, after: ClockFace): ClockEvent[] {
  const moved = (["second", "minute"] as const).filter((hand) => before[hand] !== after[hand])
  return moved.map((hand) => ({ kind: "glitchStep", hand }))
}
