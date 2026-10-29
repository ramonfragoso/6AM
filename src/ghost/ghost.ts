import { Vector3 } from "three"
import {
  SECOND_CORRIDOR_HALF_WIDTH,
  secondCorridorPoint,
  secondCorridorSpot,
} from "@/kit/corridorLayout"
import type { CorridorToken } from "@/kit/corridorSpec"
import { forwardOf, wrappedAngle } from "@/passage/passage"
import type { FurnitureSpot } from "@/props/propPlacements"

export const GHOST_URL = "/models/ghost.glb"

export const GHOST_ROOT = "ghost_rig"

export const IDLE_CLIP = "idle"

export const WALK_CLIP = "walk"

export const WALK_CLIP_SPEED = 1.42

const DEGREES = Math.PI / 180

const ARRIVED = 1e-3

const toGhost = new Vector3()

export type GhostAttack = { appearedAt: number }

export type GhostSpot = { x: number; z: number; yaw: number }

export type GhostHome = { along: number; fromWall: number }

export type GhostStride = { speed: number; turnRate: number }

export function newGhostAttack(appearedAt: number): GhostAttack {
  return { appearedAt }
}

export function ghostHome(
  first: CorridorToken[],
  coatRack: FurnitureSpot,
  { along, fromWall }: GhostHome,
): GhostSpot {
  const [rackAlong, rackAcross] = secondCorridorSpot(first, coatRack.x, coatRack.z)
  const side = Math.sign(rackAcross) || 1
  const spotAlong = rackAlong + along
  const [x, z] = secondCorridorPoint(
    first,
    spotAlong,
    side * (SECOND_CORRIDOR_HALF_WIDTH - fromWall),
  )
  const [centerX] = secondCorridorPoint(first, spotAlong, 0)
  return { x, z, yaw: Math.atan2(centerX - x, 0) }
}

export function flatDistance(spot: GhostSpot, eye: Vector3) {
  return Math.hypot(eye.x - spot.x, eye.z - spot.z)
}

export function looksAtGhost(eye: Vector3, yaw: number, spot: GhostSpot, facing: number) {
  toGhost.set(spot.x - eye.x, 0, spot.z - eye.z)
  return forwardOf(yaw).angleTo(toGhost) <= facing * DEGREES
}

export function walkToward(
  spot: GhostSpot,
  target: Vector3,
  { speed, turnRate }: GhostStride,
  seconds: number,
) {
  const dx = target.x - spot.x
  const dz = target.z - spot.z
  const distance = Math.hypot(dx, dz)
  if (distance < ARRIVED) return
  const error = wrappedAngle(Math.atan2(dx, dz) - spot.yaw)
  spot.yaw += error * (1 - Math.exp(-turnRate * seconds))
  const travel = Math.min(speed * Math.max(Math.cos(error), 0) * seconds, distance)
  spot.x += Math.sin(spot.yaw) * travel
  spot.z += Math.cos(spot.yaw) * travel
}
