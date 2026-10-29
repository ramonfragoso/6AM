import { MathUtils, type Matrix4, Vector3 } from "three"
import { wrappedAngle } from "@/passage/passage"
import { type Random, seededRandom } from "@/random/seededRandom"
import {
  floorAcross,
  floorV,
  headingAlong,
  isFree,
  newSurfaceFrame,
  onFloor,
  seamV,
  type Strip,
  stripPoint,
  surfaceFrame,
  upward,
  vDistance,
  type WallSide,
  wallSideAcross,
  worldPoint,
  wrapV,
} from "./surfaceMap"

export type Cockroaches = { releasedAt: number; seed: number }

export type CockroachStage = "hidden" | "emerging" | "climbing" | "roaming"

export type Cockroach = {
  random: Random
  stage: CockroachStage
  emergeShare: number
  strip: number
  side: WallSide
  u: number
  v: number
  depth: number
  climbShare: number
  toRoof: boolean
  heading: number
  targetHeading: number
  speed: number
  running: boolean
  burst: boolean
  motionLeft: number
  leader: number
  followLeft: number
  fleeing: boolean
  fleeTurn: number
  sizeSpread: number
  paceSpread: number
  walkPhase: number
  idlePhase: number
  walking: number
  position: Vector3
}

export type WalkSettings = {
  size: number
  sizeVariation: number
  speed: number
  speedVariation: number
  burstSpeed: number
  burstChance: number
  runMin: number
  runMax: number
  stopMin: number
  stopMax: number
  turnAngle: number
  wobble: number
  followChance: number
  followSeconds: number
  followDistance: number
  fleeDistance: number
  emergeSeconds: number
  climbMin: number
  climbMax: number
  roofShare: number
  strideLength: number
  maxStrideRate: number
}

export type SwarmMoment = {
  strips: Strip[]
  settings: WalkSettings
  sinceRelease: number
  eye: Vector3
  idleSeconds: number
}

const DEGREES = Math.PI / 180

const GOLDEN = 0.6180339887

const SPAWN_TRIES = 40

const SPAWN_INSET = 0.1

const SPAWN_CLEARANCE = 0.06

const EMERGE_TILT = 0.35

const CLIMB_SPREAD = 0.6

const ROOF_DEPTH = [0.1, 0.8] as const

const TURN_RATE = 14

const ACCELERATION = 30

const BURST_SHARE = 0.5

const BLOCKED_STOP_CHANCE = 0.4

const BLOCKED_STOP_SECONDS = 0.3

const FLEE_RELEASE = 1.4

const FLEE_SIDESTEP = Math.PI / 3

const FOLLOW_LETGO = 2

const WALKING_BLEND_RATE = 15

const STILL_SPEED = 0.005

const SURFACE_LIFT = 0.001

const SEAM_STEP = 0.001

const NOBODY = -1

const UP = new Vector3(0, 1, 0)

const frame = newSurfaceFrame()

const away = new Vector3()

const side = new Vector3()

const facing = new Vector3()

const direction = new Vector3()

export function newCockroaches(releasedAt: number, seed: number): Cockroaches {
  return { releasedAt, seed }
}

export function releaseCockroaches({ seed }: Cockroaches, strips: Strip[], count: number) {
  return Array.from({ length: count }, (_, index) =>
    releaseCockroach(seededRandom((seed + index * GOLDEN) % 1), strips),
  )
}

function releaseCockroach(random: Random, strips: Strip[]): Cockroach {
  const [strip, wall, u] = crackSpot(random, strips)
  const heading = (upward(wall) * Math.PI) / 2
  return {
    random,
    stage: "hidden",
    emergeShare: random(),
    strip,
    side: wall,
    u,
    v: seamV(strips[strip].profile, wall),
    depth: 0,
    climbShare: random(),
    toRoof: false,
    heading,
    targetHeading: heading + spread(random) * EMERGE_TILT,
    speed: 0,
    running: true,
    burst: false,
    motionLeft: 0,
    leader: NOBODY,
    followLeft: 0,
    fleeing: false,
    fleeTurn: 0,
    sizeSpread: spread(random),
    paceSpread: spread(random),
    walkPhase: random(),
    idlePhase: random(),
    walking: 1,
    position: new Vector3(),
  }
}

function crackSpot(random: Random, strips: Strip[]): [strip: number, side: WallSide, u: number] {
  const lengths = strips.map((strip) => strip.to - strip.from)
  const total = lengths.reduce((sum, length) => sum + length, 0)
  let spot: [number, WallSide, number] = [0, "left", strips[0].from]
  for (let tried = 0; tried < SPAWN_TRIES; tried++) {
    let pick = random() * total
    const strip = lengths.findIndex((length) => (pick -= length) < 0)
    const chosen = strips[strip]
    const wall: WallSide = random() < 1 / 2 ? "left" : "right"
    const u = MathUtils.lerp(chosen.from + SPAWN_INSET, chosen.to - SPAWN_INSET, random())
    spot = [strip, wall, u]
    const seam = seamV(chosen.profile, wall)
    if (
      isFree(chosen, u, seam - upward(wall) * SPAWN_CLEARANCE) &&
      isFree(chosen, u, seam + upward(wall) * SPAWN_CLEARANCE)
    ) {
      return spot
    }
  }
  return spot
}

export function stepSwarm(swarm: Cockroach[], count: number, moment: SwarmMoment, seconds: number) {
  for (let index = 0; index < count; index++) {
    const roach = swarm[index]
    if (roach.stage === "hidden") reveal(roach, moment)
    if (roach.stage === "emerging") emerge(roach, moment, seconds)
    else if (roach.stage !== "hidden") wander(roach, index, swarm, count, moment, seconds)
    animate(roach, moment, seconds)
  }
}

function reveal(roach: Cockroach, { settings, sinceRelease }: SwarmMoment) {
  if (sinceRelease < roach.emergeShare * settings.emergeSeconds) return
  roach.stage = "emerging"
  roach.depth = lengthOf(roach, settings)
  roach.toRoof = roach.random() < settings.roofShare
}

function emerge(roach: Cockroach, { settings }: SwarmMoment, seconds: number) {
  roach.speed = paceOf(roach, settings, settings.speed)
  roach.depth -= roach.speed * seconds
  if (roach.depth > 0) return
  roach.stage = "climbing"
  roach.depth = 0
  roach.motionLeft = runSeconds(roach, settings)
}

function wander(
  roach: Cockroach,
  index: number,
  swarm: Cockroach[],
  count: number,
  moment: SwarmMoment,
  seconds: number,
) {
  const { strips, settings } = moment
  const strip = strips[roach.strip]
  flee(roach, strip, moment)
  if (!roach.fleeing) keepPace(roach, index, swarm, count, settings, seconds)
  if (roach.leader !== NOBODY) follow(roach, swarm, strips, settings, seconds)
  if (roach.running && !roach.fleeing) {
    roach.targetHeading += gaussian(roach.random) * settings.wobble * DEGREES * Math.sqrt(seconds)
  }
  const error = wrappedAngle(roach.targetHeading - roach.heading)
  roach.heading += error * (1 - Math.exp(-TURN_RATE * seconds))
  const pace = roach.fleeing || roach.burst ? settings.burstSpeed : settings.speed
  const wanted = roach.running ? paceOf(roach, settings, pace) * Math.max(Math.cos(error), 0) : 0
  roach.speed += (wanted - roach.speed) * (1 - Math.exp(-ACCELERATION * seconds))
  const travel = roach.speed * seconds
  if (travel > 0) move(roach, strips, travel)
  if (
    roach.stage === "climbing" &&
    climbed(roach, strips) >= climbTarget(roach, strips, settings)
  ) {
    roach.stage = "roaming"
  }
}

function keepPace(
  roach: Cockroach,
  index: number,
  swarm: Cockroach[],
  count: number,
  settings: WalkSettings,
  seconds: number,
) {
  roach.motionLeft -= seconds
  if (roach.motionLeft > 0) return
  if (roach.running) {
    roach.running = false
    roach.burst = false
    roach.motionLeft = MathUtils.lerp(settings.stopMin, settings.stopMax, roach.random())
    return
  }
  roach.running = true
  roach.burst = roach.random() < settings.burstChance
  roach.motionLeft = runSeconds(roach, settings) * (roach.burst ? BURST_SHARE : 1)
  if (roach.stage === "climbing") {
    roach.targetHeading = (upward(roach.side) * Math.PI) / 2 + spread(roach.random) * CLIMB_SPREAD
    return
  }
  roach.targetHeading = roach.heading + spread(roach.random) * settings.turnAngle * DEGREES
  if (roach.random() < settings.followChance) {
    roach.leader = nearestLeader(roach, index, swarm, count, settings.followDistance)
    roach.followLeft = settings.followSeconds
  }
}

function flee(roach: Cockroach, strip: Strip, { settings, eye }: SwarmMoment) {
  const reach = Math.min(Math.max(roach.position.y, 0), eye.y)
  away.set(roach.position.x - eye.x, roach.position.y - reach, roach.position.z - eye.z)
  const distance = away.length()
  if (distance > settings.fleeDistance * FLEE_RELEASE) {
    if (roach.fleeing) roach.motionLeft = 0
    roach.fleeing = false
    roach.fleeTurn = 0
    return
  }
  if (distance > settings.fleeDistance && !roach.fleeing) return
  roach.fleeing = true
  roach.running = true
  roach.leader = NOBODY
  if (roach.stage === "climbing") roach.stage = "roaming"
  surfaceFrame(strip, roach.u, roach.v, roach.heading, frame)
  roach.targetHeading = headingAlong(strip, frame, away) + roach.fleeTurn
}

function follow(
  roach: Cockroach,
  swarm: Cockroach[],
  strips: Strip[],
  settings: WalkSettings,
  seconds: number,
) {
  const leader = swarm[roach.leader]
  roach.followLeft -= seconds
  const strip = strips[roach.strip]
  const du = leader.u - roach.u
  const dv = vDistance(strip.profile, roach.v, leader.v)
  if (
    roach.followLeft <= 0 ||
    leader.strip !== roach.strip ||
    leader.stage !== "roaming" ||
    Math.hypot(du, dv) > settings.followDistance * FOLLOW_LETGO
  ) {
    roach.leader = NOBODY
    return
  }
  if (roach.running) roach.targetHeading = Math.atan2(dv, du)
}

function nearestLeader(
  roach: Cockroach,
  index: number,
  swarm: Cockroach[],
  count: number,
  reach: number,
) {
  let nearest = NOBODY
  let nearestDistance = reach
  for (let other = 0; other < count; other++) {
    const candidate = swarm[other]
    if (other === index || candidate.stage !== "roaming") continue
    if (candidate.strip !== roach.strip || candidate.leader === index) continue
    const distance = Math.hypot(candidate.u - roach.u, candidate.v - roach.v)
    if (distance < nearestDistance) {
      nearest = other
      nearestDistance = distance
    }
  }
  return nearest
}

function move(roach: Cockroach, strips: Strip[], travel: number) {
  const strip = strips[roach.strip]
  const u = roach.u + Math.cos(roach.heading) * travel
  const v = roach.v + Math.sin(roach.heading) * travel
  if (throughPortal(roach, strips, u, v)) return
  if (isFree(strip, u, v)) {
    roach.u = u
    roach.v = wrapV(strip.profile, v)
    return
  }
  roach.targetHeading = roach.heading + Math.PI + spread(roach.random) * (Math.PI / 2)
  if (roach.fleeing) {
    roach.fleeTurn = MathUtils.clamp(
      roach.fleeTurn + Math.sign(spread(roach.random)) * FLEE_SIDESTEP,
      -Math.PI,
      Math.PI,
    )
  }
  roach.leader = NOBODY
  if (roach.stage === "climbing") roach.stage = "roaming"
  if (!roach.fleeing && roach.random() < BLOCKED_STOP_CHANCE) {
    roach.running = false
    roach.motionLeft = BLOCKED_STOP_SECONDS
  }
}

function throughPortal(roach: Cockroach, strips: Strip[], u: number, v: number) {
  const strip = strips[roach.strip]
  const { portal, profile } = strip
  if (!portal || u < portal.from || u > portal.to || !onFloor(profile, roach.v)) return false
  const beyond = wrapV(profile, v) - profile.rightSeam
  if (beyond <= 0 || beyond > profile.floorHalf) return false
  const target = strips[portal.into]
  const at = worldPoint(strip, u, profile.floorHalf, 0, facing)
  const [targetU, targetAcross] = stripPoint(target, at.x, at.z)
  const across = MathUtils.clamp(
    targetAcross,
    -target.profile.floorHalf + SEAM_STEP,
    target.profile.floorHalf - SEAM_STEP,
  )
  const targetV = floorV(target.profile, across)
  if (!isFree(target, targetU, targetV)) return false
  direction
    .copy(strip.along)
    .multiplyScalar(Math.cos(roach.heading))
    .addScaledVector(strip.across, Math.sin(roach.heading))
  const heading = Math.atan2(direction.dot(target.across), direction.dot(target.along))
  roach.targetHeading = heading + wrappedAngle(roach.targetHeading - roach.heading)
  roach.heading = heading
  roach.strip = portal.into
  roach.u = targetU
  roach.v = targetV
  roach.leader = NOBODY
  return true
}

function climbed(roach: Cockroach, strips: Strip[]) {
  const { profile } = strips[roach.strip]
  return wrapV(profile, upward(roach.side) * (roach.v - seamV(profile, roach.side)))
}

function climbTarget(roach: Cockroach, strips: Strip[], settings: WalkSettings) {
  const { profile } = strips[roach.strip]
  if (roach.toRoof) return profile.wallArc + MathUtils.lerp(...ROOF_DEPTH, roach.climbShare)
  return MathUtils.lerp(
    settings.climbMin,
    Math.min(settings.climbMax, profile.wallArc),
    roach.climbShare,
  )
}

function animate(roach: Cockroach, { settings, idleSeconds }: SwarmMoment, seconds: number) {
  const strides = Math.min(
    roach.speed / (settings.strideLength * lengthOf(roach, settings)),
    settings.maxStrideRate,
  )
  roach.walkPhase = (roach.walkPhase + strides * seconds) % 1
  roach.idlePhase = (roach.idlePhase + seconds / idleSeconds) % 1
  const moving = roach.stage === "emerging" || roach.speed > STILL_SPEED ? 1 : 0
  roach.walking += (moving - roach.walking) * (1 - Math.exp(-WALKING_BLEND_RATE * seconds))
}

export function placeCockroach(
  roach: Cockroach,
  strips: Strip[],
  settings: WalkSettings,
  matrix: Matrix4,
) {
  if (roach.stage === "hidden") return matrix.makeScale(0, 0, 0)
  const strip = strips[roach.strip]
  if (roach.stage === "emerging") crackFrame(roach, strip)
  else surfaceFrame(strip, roach.u, roach.v, roach.heading, frame)
  side.crossVectors(frame.normal, frame.forward).normalize()
  facing.crossVectors(side, frame.normal)
  const size = lengthOf(roach, settings)
  roach.position.copy(frame.position).addScaledVector(frame.normal, SURFACE_LIFT)
  return matrix
    .makeBasis(side, frame.normal, facing)
    .scale(direction.setScalar(size))
    .setPosition(roach.position)
}

function crackFrame(roach: Cockroach, strip: Strip) {
  const across = wallSideAcross(strip.profile, roach.side)
  const inward = -upward(roach.side)
  worldPoint(strip, roach.u, across, -roach.depth, frame.position)
  frame.normal.copy(strip.across).multiplyScalar(inward)
  frame.tangent.copy(UP).multiplyScalar(upward(roach.side))
  frame.forward
    .copy(strip.along)
    .multiplyScalar(Math.cos(roach.heading))
    .addScaledVector(frame.tangent, Math.sin(roach.heading))
    .normalize()
}

export function poseOf(roach: Cockroach): [walkPhase: number, idlePhase: number, walking: number] {
  return [roach.walkPhase, roach.idlePhase, roach.walking]
}

function lengthOf(roach: Cockroach, settings: WalkSettings) {
  return settings.size * Math.max(1 + roach.sizeSpread * settings.sizeVariation, 0)
}

function paceOf(roach: Cockroach, settings: WalkSettings, pace: number) {
  const individual = Math.max(1 + roach.paceSpread * settings.speedVariation, 0)
  return pace * individual * (lengthOf(roach, settings) / settings.size)
}

function runSeconds(roach: Cockroach, settings: WalkSettings) {
  return MathUtils.lerp(settings.runMin, settings.runMax, roach.random())
}

function spread(random: Random) {
  return random() * 2 - 1
}

function gaussian(random: Random) {
  return (random() + random() + random() + random() - 2) * Math.sqrt(3)
}
