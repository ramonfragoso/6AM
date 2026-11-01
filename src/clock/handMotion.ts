import { MathUtils } from "three"

export type HandEasing = "tick" | "sweep"

export type HandMotion = {
  from: number
  to: number
  elapsed: number
  seconds: number
  easing: HandEasing
}

export type HandMotionSettings = {
  tickSeconds: number
  glitchSeconds: number
  resetSeconds: number
  hourSeconds: number
  overshoot: number
}

export const handMotionSettings: HandMotionSettings = {
  tickSeconds: 0.12,
  glitchSeconds: 0.07,
  resetSeconds: 0.45,
  hourSeconds: 1.6,
  overshoot: 1.2,
}

const FULL_TURN = 2 * Math.PI

export function heldAt(angle: number): HandMotion {
  return {
    from: angle,
    to: angle,
    elapsed: 0,
    seconds: 0,
    easing: "tick",
  }
}

export function retarget(
  motion: HandMotion,
  angle: number,
  seconds: number,
  easing: HandEasing,
  overshoot: number,
): HandMotion {
  return {
    from: motionAngle(motion, overshoot),
    to: motion.to + shortestTurn(angle - motion.to),
    elapsed: 0,
    seconds,
    easing,
  }
}

export function motionAngle({ from, to, elapsed, seconds, easing }: HandMotion, overshoot: number) {
  if (elapsed >= seconds) return to
  const progress = elapsed / seconds
  const eased =
    easing === "tick" ? settle(progress, overshoot) : MathUtils.smootherstep(progress, 0, 1)
  return from + (to - from) * eased
}

function settle(progress: number, overshoot: number) {
  const fromEnd = progress - 1
  return 1 + (overshoot + 1) * fromEnd ** 3 + overshoot * fromEnd ** 2
}

function shortestTurn(angle: number) {
  return angle - FULL_TURN * Math.round(angle / FULL_TURN)
}
