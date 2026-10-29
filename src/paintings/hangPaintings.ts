import { type Vector3Tuple, Vector3 } from "three"
import { endWall, firstCorridorWall, type WallSpot } from "@/kit/corridorLayout"
import type { CorridorToken } from "@/kit/corridorSpec"
import type { Kit } from "@/kit/useKit"
import type { PaintingSwap } from "@/haunts/hauntState"
import { type HungPainting, PAINTINGS, type PaintingName, RIGHT_WALL_PAINTINGS } from "./paintings"

const FIRST_SIX_METER_WALL = 0

const SECOND_SIX_METER_WALL = 2

const DEGREES = Math.PI / 180

const NO_ROTATION: Vector3Tuple = [0, 0, 0]

type Stacking = "column" | "row"

type PaintingGroup = { stacking: Stacking; paintings: readonly PaintingName[] }

type PaintingScale = { size: number; growth: number }

export type GroupArrangement = {
  along: number
  height: number
  gap: number
  size: number
  depth: number
  rotations: readonly Vector3Tuple[]
}

export type HouseArrangements = {
  endWall: GroupArrangement
  leftWall: GroupArrangement
  rightWall: GroupArrangement
}

export function hangHousePaintings(
  kit: Kit,
  first: CorridorToken[],
  swaps: readonly PaintingSwap[],
  growth: number,
  arrangements: HouseArrangements,
): HungPainting[] {
  const portrait: PaintingGroup = {
    stacking: "row",
    paintings: swapped(["papa_original"], swaps),
  }
  const widePair: PaintingGroup = {
    stacking: "column",
    paintings: swapped(["apilgrimagetosanisidro", "witchessabbath"], swaps),
  }
  const tallRow: PaintingGroup = {
    stacking: "row",
    paintings: swapped(RIGHT_WALL_PAINTINGS, swaps),
  }
  return [
    ...hangGroup(kit, endWall(first), portrait, arrangements.endWall, growth),
    ...hangGroup(
      kit,
      firstCorridorWall(first, FIRST_SIX_METER_WALL, "left"),
      widePair,
      arrangements.leftWall,
      growth,
    ),
    ...hangGroup(
      kit,
      firstCorridorWall(first, SECOND_SIX_METER_WALL, "right"),
      tallRow,
      arrangements.rightWall,
      growth,
    ),
  ]
}

function swapped(paintings: readonly PaintingName[], swaps: readonly PaintingSwap[]) {
  return paintings.map(
    (painting) => swaps.find(({ replaced }) => replaced === painting)?.by ?? painting,
  )
}

function hangGroup(
  kit: Kit,
  spot: WallSpot,
  group: PaintingGroup,
  arrangement: GroupArrangement,
  growth: number,
): HungPainting[] {
  const alongWall = arrangement.size * growth
  const boxes = group.paintings.map((painting) => kit[PAINTINGS[painting]].bounds)
  const extents = boxes.map((box) => {
    const size = box.getSize(new Vector3()).multiplyScalar(alongWall)
    return group.stacking === "row" ? size.x : size.y
  })
  const total = extents.reduce(
    (sum, extent) => sum + extent,
    arrangement.gap * (extents.length - 1),
  )
  let cursor = -total / 2
  return group.paintings.map((painting, index) => {
    const offset = cursor + extents[index] / 2
    cursor += extents[index] + arrangement.gap
    const center = boxes[index].getCenter(new Vector3()).multiplyScalar(alongWall)
    const across = arrangement.along + (group.stacking === "row" ? offset : 0) - center.x
    const up = arrangement.height - (group.stacking === "column" ? offset : 0) - center.y
    const rotation = arrangement.rotations[index] ?? NO_ROTATION
    const scale = { size: arrangement.size, growth }
    return hang(painting, spot, [across, up, arrangement.depth], scale, rotation)
  })
}

function hang(
  painting: PaintingName,
  { position: [wallX, , wallZ], rotationY }: WallSpot,
  [across, up, out]: Vector3Tuple,
  { size, growth }: PaintingScale,
  [x, y, z]: Vector3Tuple,
): HungPainting {
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  const frame = PAINTINGS[painting]
  return {
    painting,
    frame,
    placement: {
      piece: frame,
      position: [wallX + across * cos + out * sin, up, wallZ - across * sin + out * cos],
      rotationY: rotationY + y * DEGREES,
      tilt: [x * DEGREES, z * DEGREES],
      scale: size,
      stretch: [growth, growth],
    },
  }
}
