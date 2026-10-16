import { MathUtils, Vector3 } from "three"

export type PassageTiming = {
  lineUpEnd: number
  openStart: number
  openEnd: number
  throughStart: number
  throughEnd: number
  closeStart: number
}

export type Pose = { eye: Vector3; yaw: number; pitch: number }

export type PassageRoute = {
  from: Pose
  doorCenter: Vector3
  heading: Vector3
  awayFromHinge: Vector3
}

export type PassageShape = {
  lineUp: number
  through: number
  bow: number
  lean: number
  drift: number
}

export type PassageMoment = { pose: Pose; opened: number; closed: number }

export type CurveSettings = { curve: number; curveVariation: number }

const LOOK_INTO_BEND = 0.6

const SLOPE_STEP = 0.001

const FULL_TURN = Math.PI * 2

const MAX_LEAN = 0.75

const MAX_DRIFT = MathUtils.degToRad(4)

const LEVEL = 0

export function passageMoment(
  route: PassageRoute,
  shape: PassageShape,
  timing: PassageTiming,
  progress: number,
): PassageMoment {
  const settle = eased(phase(progress, 0, timing.lineUpEnd))
  const advance = eased(phase(progress, timing.throughStart, timing.throughEnd))
  const lineUpEye = alongDoor(route, -shape.lineUp)
  const endEye = alongDoor(route, shape.through)
  const eye = route.from.eye
    .clone()
    .lerp(lineUpEye, settle)
    .addScaledVector(endEye.sub(lineUpEye), advance)
    .addScaledVector(route.awayFromHinge, shape.bow * bump(advance, shape.lean))

  const facing = yawAlong(route.heading)
  const bendSide = Math.sign(rightOf(facing).dot(route.awayFromHinge))
  const slope = (shape.bow * bumpSlope(advance, shape.lean)) / (shape.lineUp + shape.through)
  const yaw =
    lerpAngle(route.from.yaw, facing, settle) -
    bendSide * Math.atan(slope) * LOOK_INTO_BEND +
    shape.drift * Math.sin(Math.PI * advance)

  return {
    pose: { eye, yaw, pitch: MathUtils.lerp(route.from.pitch, LEVEL, settle) },
    opened: eased(phase(progress, timing.openStart, timing.openEnd)),
    closed: eased(phase(progress, timing.closeStart, 1)),
  }
}

export function passageShape(
  lineUp: number,
  through: number,
  { curve, curveVariation }: CurveSettings,
  random: () => number = Math.random,
): PassageShape {
  return {
    lineUp,
    through,
    bow: curve * (1 - curveVariation * random()),
    lean: (random() * 2 - 1) * MAX_LEAN * curveVariation,
    drift: (random() * 2 - 1) * MAX_DRIFT * curveVariation,
  }
}

export function yawAlong(direction: Vector3) {
  return Math.atan2(-direction.x, -direction.z)
}

export function forwardOf(yaw: number) {
  return new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
}

export function wrappedAngle(angle: number) {
  return angle - FULL_TURN * Math.round(angle / FULL_TURN)
}

function alongDoor({ doorCenter, heading, from }: PassageRoute, distance: number) {
  return doorCenter.clone().addScaledVector(heading, distance).setY(from.eye.y)
}

function rightOf(yaw: number) {
  return new Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
}

function lerpAngle(from: number, to: number, amount: number) {
  return from + wrappedAngle(to - from) * amount
}

function bump(progress: number, lean: number) {
  return Math.sin(Math.PI * progress) ** 2 * (1 + lean * (2 * progress - 1))
}

function bumpSlope(progress: number, lean: number) {
  return (bump(progress + SLOPE_STEP, lean) - bump(progress - SLOPE_STEP, lean)) / (2 * SLOPE_STEP)
}

function phase(progress: number, start: number, end: number) {
  if (end <= start) return progress >= start ? 1 : 0
  return MathUtils.clamp((progress - start) / (end - start), 0, 1)
}

function eased(progress: number) {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
}
