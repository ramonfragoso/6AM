import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { Matrix4, type Object3D } from "three"
import { handAngle, type Hand, HANDS } from "./clock"
import { type ClockEvent, clockEvents } from "./clockEvents"
import { type ClockFace, clockFace, clockTime, runClock, sameFace } from "./clockTime"
import {
  type HandEasing,
  type HandMotion,
  handMotionSettings,
  heldAt,
  motionAngle,
  retarget,
} from "./handMotion"
import { playing } from "@/title/title"
import type { ClockHand } from "./useClockModel"

type HandObjects = Partial<Record<Hand, Object3D>>

type HandAngles = Partial<Record<Hand, number>>

type HandMotions = Record<Hand, HandMotion>

type MotionStyle = { seconds: number; easing: HandEasing }

const turn = new Matrix4()

export function useClockHands(hands: Record<Hand, ClockHand>) {
  const objects = useRef<HandObjects>({})
  const drawn = useRef<HandAngles>({})
  const motions = useRef<HandMotions | null>(null)
  const shownFace = useRef<ClockFace | null>(null)
  const shownRestart = useRef(clockTime.restarts)

  useFrame((_, delta) => {
    if (playing()) runClock(delta)
    const face = clockFace()
    const shown = shownFace.current
    const restarted = shownRestart.current !== clockTime.restarts
    shownRestart.current = clockTime.restarts
    if (!shown || !motions.current || !sameFace(shown, face)) {
      shownFace.current = face
      motions.current = movedHands(motions.current, shown, face, restarted)
      if (shown && !restarted) for (const event of faceEvents(shown, face)) clockEvents.emit(event)
    }
    for (const hand of HANDS) {
      const motion = motions.current[hand]
      motion.elapsed += delta
      const object = objects.current[hand]
      if (!object) continue
      const angle = motionAngle(motion, handMotionSettings.overshoot)
      if (drawn.current[hand] === angle) continue
      drawn.current[hand] = angle
      object.matrix.copy(hands[hand].anchor).multiply(turn.makeRotationZ(angle))
      object.matrixWorldNeedsUpdate = true
    }
  })

  return useMemo(
    () =>
      Object.fromEntries(
        HANDS.map((hand) => [
          hand,
          (object: Object3D | null) => {
            if (object) objects.current[hand] = object
            else delete objects.current[hand]
            delete drawn.current[hand]
            shownFace.current = null
          },
        ]),
      ) as Record<Hand, (object: Object3D | null) => void>,
    [],
  )
}

function movedHands(
  motions: HandMotions | null,
  before: ClockFace | null,
  after: ClockFace,
  restarted: boolean,
): HandMotions {
  const moved = (hand: Hand) => {
    const angle = handAngle(hand, after)
    if (!motions || !before) return heldAt(angle)
    const { seconds, easing } = motionStyle(hand, before, after, restarted)
    return retarget(motions[hand], angle, seconds, easing, handMotionSettings.overshoot)
  }
  return Object.fromEntries(HANDS.map((hand) => [hand, moved(hand)])) as HandMotions
}

function motionStyle(
  hand: Hand,
  before: ClockFace,
  after: ClockFace,
  restarted: boolean,
): MotionStyle {
  const { tickSeconds, glitchSeconds, resetSeconds, hourSeconds } = handMotionSettings
  if (restarted) {
    return { seconds: hand === "hour" ? hourSeconds : resetSeconds, easing: "sweep" }
  }
  if (after.phase === "glitch") return { seconds: glitchSeconds, easing: "tick" }
  if (before.phase === "glitch") return { seconds: resetSeconds, easing: "sweep" }
  return { seconds: tickSeconds, easing: "tick" }
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
