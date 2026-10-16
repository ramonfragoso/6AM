import { type Box3, Matrix4, Quaternion, Vector3, type Vector3Tuple } from "three"
import type { FurnitureSpot } from "@/props/propPlacements"
import type { ClockFace } from "./clockTime"

export const CLOCK_URL = "/models/clock.glb"

export const HANDS = ["hour", "minute", "second"] as const

export type Hand = (typeof HANDS)[number]

export const CLOCK_PIECES = [
  "round_table",
  "clock",
  "clock_glass",
  "clock_hand_hour",
  "clock_hand_minute",
  "clock_hand_second",
] as const

export type ClockPiece = (typeof CLOCK_PIECES)[number]

export const HAND_PIECES: Record<Hand, ClockPiece> = {
  hour: "clock_hand_hour",
  minute: "clock_hand_minute",
  second: "clock_hand_second",
}

export const HAND_ANCHORS: Record<Hand, string> = {
  hour: "anchor_hand_hour",
  minute: "anchor_hand_minute",
  second: "anchor_hand_second",
}

export const CLOCK_TABLE_SPOT: FurnitureSpot = {
  x: 1.35,
  z: 0.9,
  turn: 0,
  size: 1,
}

export const CLOCK_SPOT: FurnitureSpot = {
  x: 0,
  z: 0,
  turn: -137,
  size: 1,
}

const MARKS_ON_DIAL = 60

const SECONDS_ON_DIAL = 12 * 60 * 60

const MARKS_PER_TURN: Record<Hand, number> = {
  hour: SECONDS_ON_DIAL,
  minute: MARKS_ON_DIAL,
  second: MARKS_ON_DIAL,
}

const FULL_TURN = 2 * Math.PI

const CLOCKWISE = -1

const DEGREES = Math.PI / 180

const UP = new Vector3(0, 1, 0)

export function handAngle(hand: Hand, face: ClockFace) {
  const turn = MARKS_PER_TURN[hand]
  return CLOCKWISE * FULL_TURN * (positiveModulo(face[hand], turn) / turn)
}

export function tableMatrix({ x, z, turn, size }: FurnitureSpot) {
  return spotMatrix([x, 0, z], turn, size)
}

export function clockOnTableMatrix({ x, z, turn, size }: FurnitureSpot, tableTop: number) {
  return spotMatrix([x, tableTop, z], turn, size)
}

export function tableCollider(bounds: Box3, size: number) {
  const center = bounds.getCenter(new Vector3())
  const extent = bounds.getSize(new Vector3())
  const halfHeight = (bounds.max.y * size) / 2
  return {
    args: [halfHeight, (Math.max(extent.x, extent.z) / 2) * size] as [
      halfHeight: number,
      radius: number,
    ],
    position: [center.x * size, halfHeight, center.z * size] as Vector3Tuple,
  }
}

function spotMatrix(position: Vector3Tuple, turn: number, size: number) {
  return new Matrix4().compose(
    new Vector3(...position),
    new Quaternion().setFromAxisAngle(UP, turn * DEGREES),
    new Vector3().setScalar(size),
  )
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}
