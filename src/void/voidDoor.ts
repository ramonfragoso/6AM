import { MathUtils } from "three"

export type VoidDoor = { openedAt: number }

export type VoidDoorTiming = { delay: number; openSeconds: number; angle: number }

export function newVoidDoor(openedAt: number): VoidDoor {
  return { openedAt }
}

export function openedShare(seconds: number, { delay, openSeconds }: VoidDoorTiming) {
  if (openSeconds <= 0) return seconds >= delay ? 1 : 0
  return MathUtils.clamp((seconds - delay) / openSeconds, 0, 1)
}

export function voidLeafAngle(seconds: number, timing: VoidDoorTiming) {
  return timing.angle * MathUtils.smoothstep(openedShare(seconds, timing), 0, 1)
}
