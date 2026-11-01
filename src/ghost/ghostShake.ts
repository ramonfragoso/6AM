import { Euler, MathUtils, type Object3D, Quaternion, Vector3 } from "three"
import type { Random } from "@/random/seededRandom"

export type ShakeSettings = {
  shakeRate: number
  headAngle: number
  torsoShare: number
  jerkEvery: number
  jerkAngle: number
  jerkSeconds: number
}

export type ShakenBone = { bone: Object3D; head: boolean }

type Wobble = { from: Vector3; to: Vector3 }

type Jerk = { direction: Vector3; age: number }

export type GhostShake = {
  wobbles: Wobble[]
  progress: number
  jerk: Jerk | null
  untilJerk: number | null
  random: Random
}

export const SHAKEN_BONES = [
  { name: "Spine", head: false },
  { name: "Spine1", head: false },
  { name: "Spine2", head: false },
  { name: "Neck", head: true },
  { name: "Head", head: true },
]

const JERK_RISE_SECONDS = 0.04

const DEGREES = Math.PI / 180

const offset = new Vector3()

const turn = new Euler()

const twist = new Quaternion()

export function createShake(bones: number, random: Random = Math.random): GhostShake {
  return {
    wobbles: Array.from({ length: bones }, () => ({
      from: randomOffset(new Vector3(), random),
      to: randomOffset(new Vector3(), random),
    })),
    progress: 0,
    jerk: null,
    untilJerk: null,
    random,
  }
}

export function shakeBones(
  shake: GhostShake,
  bones: ShakenBone[],
  settings: ShakeSettings,
  seconds: number,
) {
  advanceWobbles(shake, settings.shakeRate * seconds)
  advanceJerk(shake, settings, seconds)
  const eased = MathUtils.smoothstep(shake.progress, 0, 1)
  const jerked = jerkStrength(shake.jerk, settings.jerkSeconds) * settings.jerkAngle * DEGREES
  bones.forEach(({ bone, head }, index) => {
    const { from, to } = shake.wobbles[index]
    const angle = settings.headAngle * DEGREES * (head ? 1 : settings.torsoShare)
    offset.lerpVectors(from, to, eased).multiplyScalar(angle)
    if (head && shake.jerk) offset.addScaledVector(shake.jerk.direction, jerked)
    bone.quaternion.multiply(twist.setFromEuler(turn.set(offset.x, offset.y, offset.z)))
  })
}

function advanceWobbles(shake: GhostShake, steps: number) {
  shake.progress += steps
  if (shake.progress < 1) return
  const jumped = shake.progress >= 2
  shake.progress %= 1
  for (const wobble of shake.wobbles) {
    if (jumped) randomOffset(wobble.from, shake.random)
    else wobble.from.copy(wobble.to)
    randomOffset(wobble.to, shake.random)
  }
}

function advanceJerk(shake: GhostShake, settings: ShakeSettings, seconds: number) {
  if (shake.jerk) {
    shake.jerk.age += seconds
    if (shake.jerk.age >= JERK_RISE_SECONDS + settings.jerkSeconds) shake.jerk = null
    return
  }
  if (shake.untilJerk === null) {
    shake.untilJerk = untilNextJerk(shake.random, settings.jerkEvery)
    return
  }
  shake.untilJerk -= seconds
  if (shake.untilJerk > 0) return
  shake.untilJerk = untilNextJerk(shake.random, settings.jerkEvery)
  shake.jerk = { direction: randomOffset(new Vector3(), shake.random).normalize(), age: 0 }
}

function untilNextJerk(random: Random, jerkEvery: number) {
  return -Math.log(1 - random()) * jerkEvery
}

function jerkStrength(jerk: Jerk | null, jerkSeconds: number) {
  if (!jerk) return 0
  if (jerk.age < JERK_RISE_SECONDS) return jerk.age / JERK_RISE_SECONDS
  return 1 - MathUtils.smoothstep(jerk.age, JERK_RISE_SECONDS, JERK_RISE_SECONDS + jerkSeconds)
}

function randomOffset(target: Vector3, random: Random) {
  return target.set(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1)
}
