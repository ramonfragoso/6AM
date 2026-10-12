import { type Vector3Tuple, Vector3 } from "three"
import { endWall, firstCorridorWall, type WallSpot } from "@/kit/corridorLayout"
import type { CorridorToken } from "@/kit/corridorSpec"
import type { Kit } from "@/kit/useKit"
import { type HungPainting, PAINTINGS, type PaintingName } from "./paintings"

const FIRST_SIX_METER_WALL = 0

const SECOND_SIX_METER_WALL = 2

const DEGREES = Math.PI / 180

const NO_ROTATION: Vector3Tuple = [0, 0, 0]

type Stacking = "column" | "row"

type PaintingGroup = { stacking: Stacking; paintings: readonly PaintingName[] }

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

export type PaintingSwaps = { scaryPapa: boolean; scaryMonks: boolean }

export function hangHousePaintings(
  kit: Kit,
  first: CorridorToken[],
  { scaryPapa, scaryMonks }: PaintingSwaps,
  arrangements: HouseArrangements,
): HungPainting[] {
  const portrait: PaintingGroup = {
    stacking: "row",
    paintings: [scaryPapa ? "papa_scary" : "papa_original"],
  }
  const widePair: PaintingGroup = {
    stacking: "column",
    paintings: ["apilgrimagetosanisidro", "witchessabbath"],
  }
  const tallRow: PaintingGroup = {
    stacking: "row",
    paintings: [scaryMonks ? "saturndevouring" : "twomonks", "twowomaneating", "reading"],
  }
  return [
    ...hangGroup(kit, endWall(first), portrait, arrangements.endWall),
    ...hangGroup(
      kit,
      firstCorridorWall(first, FIRST_SIX_METER_WALL, "left"),
      widePair,
      arrangements.leftWall,
    ),
    ...hangGroup(
      kit,
      firstCorridorWall(first, SECOND_SIX_METER_WALL, "right"),
      tallRow,
      arrangements.rightWall,
    ),
  ]
}

function hangGroup(
  kit: Kit,
  spot: WallSpot,
  group: PaintingGroup,
  arrangement: GroupArrangement,
): HungPainting[] {
  const boxes = group.paintings.map((painting) => kit[PAINTINGS[painting]].bounds)
  const extents = boxes.map((box) => {
    const size = box.getSize(new Vector3()).multiplyScalar(arrangement.size)
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
    const center = boxes[index].getCenter(new Vector3()).multiplyScalar(arrangement.size)
    const across = arrangement.along + (group.stacking === "row" ? offset : 0) - center.x
    const up = arrangement.height - (group.stacking === "column" ? offset : 0) - center.y
    const rotation = arrangement.rotations[index] ?? NO_ROTATION
    return hang(painting, spot, [across, up, arrangement.depth], arrangement.size, rotation)
  })
}

function hang(
  painting: PaintingName,
  { position: [wallX, , wallZ], rotationY }: WallSpot,
  [across, up, out]: Vector3Tuple,
  scale: number,
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
      scale,
    },
  }
}
