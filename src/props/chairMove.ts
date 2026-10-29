import { MathUtils, Matrix4 } from "three"
import type { FurnitureSpot } from "./propPlacements"

export const CHAIR_MOVE_SECONDS = 0.7

const DEGREES = Math.PI / 180

const pivot = new Matrix4()

const turned = new Matrix4()

export type ChairMove = { startedAt: number }

export type ChairMoveSettings = {
  shiftX: number
  shiftZ: number
  turn: number
  acceleration: number
}

export function newChairMove(startedAt: number): ChairMove {
  return { startedAt }
}

export function chairMoveShare(seconds: number, acceleration: number) {
  const progress = MathUtils.clamp(seconds / CHAIR_MOVE_SECONDS, 0, 1)
  return progress ** acceleration
}

export function movedChairMatrix(
  { x, z }: FurnitureSpot,
  { shiftX, shiftZ, turn }: ChairMoveSettings,
  share: number,
  target: Matrix4,
) {
  target.makeTranslation(x + shiftX * share, 0, z + shiftZ * share)
  turned.makeRotationY(turn * DEGREES * share)
  pivot.makeTranslation(-x, 0, -z)
  return target.multiply(turned).multiply(pivot)
}

export function movedChairSpot(spot: FurnitureSpot, settings: ChairMoveSettings): FurnitureSpot {
  return {
    ...spot,
    x: spot.x + settings.shiftX,
    z: spot.z + settings.shiftZ,
    turn: spot.turn + settings.turn,
  }
}
