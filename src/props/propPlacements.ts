import { firstCorridorColumns, secondCorridorColumn } from "@/kit/corridorLayout"
import type { CorridorToken } from "@/kit/corridorSpec"
import type { KitPiece, Placement } from "@/kit/kitPieces"

const DEGREES = Math.PI / 180

export type FurnitureSpot = {
  x: number
  z: number
  turn: number
  size: number
}

export function furniturePlacement(
  piece: KitPiece,
  { x, z, turn, size }: FurnitureSpot,
): Placement {
  return {
    piece,
    position: [x, 0, z],
    rotationY: turn * DEGREES,
    scale: size,
  }
}

export function lanternPlacements(first: CorridorToken[], height: number): Placement[] {
  return firstCorridorColumns(first).map(({ position: [x, y, z], rotationY }) => ({
    piece: "lantern",
    position: [x, y + height, z],
    rotationY,
  }))
}

export type TiledLanternSpot = {
  x: number
  z: number
  height: number
  turn: number
  size: number
}

const SPOT_DECIMALS = 3

const TILED_LANTERN_COLUMN = 0

const TILED_LANTERN_SIDE = "right"

export function tiledLanternSpot(
  first: CorridorToken[],
  second: CorridorToken[],
): TiledLanternSpot {
  const {
    position: [x, , z],
    rotationY,
  } = secondCorridorColumn(first, second, TILED_LANTERN_COLUMN, TILED_LANTERN_SIDE)
  return {
    x: rounded(x),
    z: rounded(z),
    height: 0,
    turn: rounded(rotationY / DEGREES),
    size: 1,
  }
}

export function tiledLanternPlacement(
  { x, z, height, turn, size }: TiledLanternSpot,
  lanternHeight: number,
): Placement {
  return {
    piece: "lantern",
    position: [x, lanternHeight + height, z],
    rotationY: turn * DEGREES,
    scale: size,
  }
}

function rounded(value: number) {
  return Number(value.toFixed(SPOT_DECIMALS))
}
