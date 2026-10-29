import { MathUtils } from "three"
import { seededRandom } from "@/random/seededRandom"

export const RATTLE_SLAMS = [
  0.382, 1.903, 3.205, 4.482, 5.366, 5.78, 6.205, 6.607, 7.033, 7.49, 7.926, 8.176, 8.416, 8.658,
  8.902, 9.15, 9.376, 9.612, 9.851, 10.1, 10.336, 10.589, 10.835, 11.068, 11.314, 11.551, 11.822,
]

const REBOUND_SECONDS = 0.121

const TILT_FREQUENCY_RATIO = 1.31

const MILLIMETERS = 1000

const TAU = Math.PI * 2

export type DoorRattle = { startedAt: number; seed: number }

export type RattleSettings = {
  firstOpenSeconds: number
  maxAngle: number
  anglePerSecond: number
  minShare: number
  restShare: number
  closeSeconds: number
  closeShare: number
  closePower: number
  reboundAngle: number
  lanternFlicker: number
  shake: ShakeSettings
}

export type ShakeSettings = {
  distance: number
  tilt: number
  frequency: number
  seconds: number
}

type PlannedSlam = {
  openFrom: number
  closeFrom: number
  at: number
  top: number
  phase: number
}

export type RattlePlan = { slams: PlannedSlam[]; settings: RattleSettings }

export type LeafPose = { angle: number; offset: number; tilt: number }

export const RESTING_LEAF: Readonly<LeafPose> = { angle: 0, offset: 0, tilt: 0 }

export function newRattle(startedAt: number): DoorRattle {
  return { startedAt, seed: Math.random() }
}

export function planRattle(seed: number, settings: RattleSettings): RattlePlan {
  const random = seededRandom(seed)
  const firstSlam = RATTLE_SLAMS[0]
  const rebound = settings.reboundAngle > 0 ? REBOUND_SECONDS : 0
  let previous = 0
  const slams = RATTLE_SLAMS.map((time, index) => {
    const at = settings.firstOpenSeconds + time - firstSlam
    const gap = at - previous
    const openFrom = index === 0 ? 0 : previous + Math.max(settings.restShare * gap, rebound)
    const closing = Math.min(settings.closeSeconds, settings.closeShare * gap)
    const closeFrom = Math.max(at - closing, openFrom)
    const cap = Math.min(settings.maxAngle, settings.anglePerSecond * gap)
    const share = MathUtils.lerp(settings.minShare, 1, random())
    const top = closeFrom > openFrom ? cap * share : 0
    previous = at
    return {
      openFrom,
      closeFrom,
      at,
      top,
      phase: random() * TAU,
    }
  })
  return { slams, settings }
}

export function planSlam(top: number, settings: RattleSettings): RattlePlan {
  const slam = {
    openFrom: 0,
    closeFrom: 0,
    at: settings.closeSeconds,
    top,
    phase: 0,
  }
  return { slams: [slam], settings }
}

export function firstSlamAt({ slams }: RattlePlan) {
  return slams[0].at
}

export function soundStartOf(settings: RattleSettings) {
  return settings.firstOpenSeconds - RATTLE_SLAMS[0]
}

export function rattleEnd({ slams, settings }: RattlePlan) {
  return slams[slams.length - 1].at + Math.max(REBOUND_SECONDS, settings.shake.seconds)
}

export function leafPoseAt(plan: RattlePlan, seconds: number, pose: LeafPose) {
  pose.angle = swingAt(plan, seconds)
  shakeAt(plan, seconds, pose)
  return pose
}

function swingAt({ slams, settings }: RattlePlan, seconds: number) {
  if (seconds < 0) return 0
  const next = slams.findIndex((slam) => seconds < slam.at)
  const last = next === -1 ? slams[slams.length - 1] : slams[next - 1]
  const sinceSlam = last ? seconds - last.at : Number.POSITIVE_INFINITY
  if (next === -1) return reboundAt(sinceSlam, settings.reboundAngle)
  const { openFrom, closeFrom, at, top } = slams[next]
  if (seconds < openFrom) return reboundAt(sinceSlam, settings.reboundAngle)
  if (seconds < closeFrom) return top * MathUtils.smoothstep(seconds, openFrom, closeFrom)
  const closed = (seconds - closeFrom) / (at - closeFrom)
  return top * (1 - closed ** settings.closePower)
}

function reboundAt(sinceSlam: number, angle: number) {
  if (sinceSlam >= REBOUND_SECONDS) return 0
  return angle * Math.sin((Math.PI * sinceSlam) / REBOUND_SECONDS)
}

function shakeAt({ slams, settings }: RattlePlan, seconds: number, pose: LeafPose) {
  const { distance, tilt, frequency, seconds: length } = settings.shake
  pose.offset = 0
  pose.tilt = 0
  if (length <= 0) return
  for (const { at, phase } of slams) {
    const since = seconds - at
    if (since < 0 || since >= length) continue
    const fading = (1 - since / length) ** 2
    const turn = TAU * frequency * since + phase
    pose.offset += (distance / MILLIMETERS) * fading * Math.sin(turn)
    pose.tilt += tilt * fading * Math.cos(turn * TILT_FREQUENCY_RATIO)
  }
}
