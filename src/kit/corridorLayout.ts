import type { Vector3Tuple } from "three"
import type { CorridorToken } from "./corridorSpec"
import { type KitPiece, type Placement, type WallLength, wallPiece } from "./kitPieces"

const SEGMENT_LENGTH = 2

const FIRST_HALF_WIDTH = 1.2

const SECOND_HALF_WIDTH = 1.05

const COLUMN_INSET = 0.1015

const CORNER_LENGTH: WallLength = 2

const END_WALL_OFFSET = 0.05

const END_WALL_LENGTH = 2 * FIRST_HALF_WIDTH

const WALL_SURFACE = 0.05

const SECOND_ROOF_OFFSET = 0.1455

const DIVISION_HALF_LENGTH = 0.2015

const TILES_ACROSS = 4

const TILE_WIDTH = 0.425

const TILE_ROW_LENGTH = 0.4

const TILE_JITTER = 0.0175

const TILE_QUARTER_TURN = Math.PI / 2

const FLIP_SEED = 1

const YAW_SEED = 2

const TILT_X_SEED = 3

const TILT_Z_SEED = 4

const FLOOR_OVERHANG_UNDER_DOOR = 0.54

const FLOOR_PLANK_ROW_LENGTH = 2.505

const FACING_FORWARD = 0

const FACING_BACK = Math.PI

const ACROSS_FORWARD = Math.PI / 2

const ACROSS_BACK = -Math.PI / 2

const TURN_RIGHT = -Math.PI / 2

const LENGTH_TOLERANCE = 1e-3

const SECOND_CORNER_JOINTS = [0]

export type WallSide = "left" | "right"

export type WallSpot = { position: Vector3Tuple; rotationY: number; length: number }

type RunOptions = {
  halfWidth: number
  column: KitPiece
  drains: boolean
  roofs: boolean
  cornerJoints: number[]
}

export function houseLayout(first: CorridorToken[], second: CorridorToken[]): Placement[] {
  const firstLength = lengthOf(first)
  const start = -firstLength / 2
  const corner = start + firstLength

  const firstCorridor = corridorRun(first, {
    halfWidth: FIRST_HALF_WIDTH,
    column: "column",
    drains: true,
    roofs: true,
    cornerJoints: [firstLength],
  }).map((placement) => shifted(placement, start))

  const secondCorridor = secondCorridorPlacements(second).map((placement) =>
    turned(placement, secondCorridorOrigin(first)),
  )

  return [
    { piece: "door", position: [start, 0, 0], rotationY: ACROSS_FORWARD },
    ...firstCorridor,
    ...cornerPlacements(corner),
    ...floorRows(start, firstLength + CORNER_LENGTH),
    ...secondCorridor,
  ]
}

export function firstCorridorWall(
  first: CorridorToken[],
  wallIndex: number,
  side: WallSide,
): WallSpot {
  const lengths = first.flatMap((token) => (token.kind === "wall" ? [token.length] : []))
  const length = lengths[wallIndex]
  if (length === undefined)
    throw new Error(`The first Corridor has no wall number ${wallIndex + 1}`)
  const before = lengths.slice(0, wallIndex).reduce((sum, wall) => sum + wall, 0)
  const x = -lengthOf(first) / 2 + before + length / 2
  const surface = FIRST_HALF_WIDTH - WALL_SURFACE
  return side === "left"
    ? { position: [x, 0, -surface], rotationY: FACING_FORWARD, length }
    : { position: [x, 0, surface], rotationY: FACING_BACK, length }
}

function secondCorridorOrigin(first: CorridorToken[]): [number, number] {
  return [lengthOf(first) / 2 + CORNER_LENGTH / 2, FIRST_HALF_WIDTH - COLUMN_INSET]
}

export function secondCorridorColumn(
  first: CorridorToken[],
  second: CorridorToken[],
  columnIndex: number,
  side: WallSide,
): Placement {
  const joints = columnJointsOf(second).filter((joint) => joint > LENGTH_TOLERANCE)
  const joint = joints[columnIndex]
  if (joint === undefined) {
    throw new Error(`The second Corridor has no column number ${columnIndex + 1}`)
  }
  const column =
    side === "left"
      ? onLeft("column_narrow", joint, SECOND_HALF_WIDTH)
      : onRight("column_narrow", joint, SECOND_HALF_WIDTH)
  return turned(column, secondCorridorOrigin(first))
}

export function secondCorridorWall(
  first: CorridorToken[],
  second: CorridorToken[],
  wallIndex: number,
  side: WallSide,
): Placement {
  const lengths = second.flatMap((token) => (token.kind === "wall" ? [token.length] : []))
  const length = lengths[wallIndex]
  if (length === undefined) {
    throw new Error(`The second Corridor has no wall number ${wallIndex + 1}`)
  }
  const from = lengths.slice(0, wallIndex).reduce((sum, wall) => sum + wall, 0)
  const columnKeys = new Set([...columnJointsOf(second), ...SECOND_CORNER_JOINTS].map(jointKey))
  const [left, right] = wallPair(length, from, columnKeys, SECOND_HALF_WIDTH)
  return turned(side === "left" ? left : right, secondCorridorOrigin(first))
}

export function firstCorridorColumns(first: CorridorToken[]): Placement[] {
  const length = lengthOf(first)
  const ownJoints = columnJointsOf(first).filter((joint) => jointKey(joint) !== jointKey(length))
  return [...ownJoints, length]
    .flatMap((joint) => [
      onLeft("column", joint, FIRST_HALF_WIDTH),
      onRight(joint === length ? "column_corner" : "column", joint, FIRST_HALF_WIDTH),
    ])
    .map((placement) => shifted(placement, -length / 2))
}

export function endWall(first: CorridorToken[]): WallSpot {
  const corner = lengthOf(first) / 2
  return {
    position: [corner + CORNER_LENGTH + END_WALL_OFFSET - WALL_SURFACE, 0, 0],
    rotationY: ACROSS_BACK,
    length: END_WALL_LENGTH,
  }
}

function corridorRun(tokens: CorridorToken[], options: RunOptions): Placement[] {
  const columnJoints = columnJointsOf(tokens)
  const columnKeys = new Set([...columnJoints, ...options.cornerJoints].map(jointKey))
  const ownColumns = columnJoints.filter(
    (joint) => !options.cornerJoints.some((corner) => jointKey(corner) === jointKey(joint)),
  )
  const placements: Placement[] = []
  let cursor = 0
  for (const token of tokens) {
    if (token.kind === "frame") {
      placements.push({ piece: "door_frame", position: [cursor, 0, 0], rotationY: ACROSS_FORWARD })
    } else if (token.kind === "wall") {
      placements.push(...wallRun(token.length, cursor, columnKeys, options))
      cursor += token.length
    }
  }
  for (const joint of ownColumns) {
    placements.push(
      onLeft(options.column, joint, options.halfWidth),
      onRight(options.column, joint, options.halfWidth),
    )
  }
  return placements
}

function wallRun(
  length: WallLength,
  from: number,
  columnKeys: Set<string>,
  options: RunOptions,
): Placement[] {
  const to = from + length
  const placements: Placement[] = [...wallPair(length, from, columnKeys, options.halfWidth)]
  for (let segment = from; segment < to - LENGTH_TOLERANCE; segment += SEGMENT_LENGTH) {
    if (options.roofs) {
      placements.push({ piece: "roof", position: [segment, 0, 0], rotationY: FACING_FORWARD })
    }
    if (options.drains) {
      placements.push(
        onLeft("drain", segment, options.halfWidth),
        onRight("drain", segment + SEGMENT_LENGTH, options.halfWidth),
      )
    }
  }
  return placements
}

function wallPair(
  length: WallLength,
  from: number,
  columnKeys: Set<string>,
  halfWidth: number,
): [left: Placement, right: Placement] {
  const to = from + length
  const columnAtFrom = columnKeys.has(jointKey(from))
  const columnAtTo = columnKeys.has(jointKey(to))
  return [
    onLeft(
      wallPiece(length, { columnAtStart: columnAtFrom, columnAtEnd: columnAtTo }),
      from,
      halfWidth,
    ),
    onRight(
      wallPiece(length, { columnAtStart: columnAtTo, columnAtEnd: columnAtFrom }),
      to,
      halfWidth,
    ),
  ]
}

function cornerPlacements(at: number): Placement[] {
  const far = at + CORNER_LENGTH
  return [
    onLeft("column", at, FIRST_HALF_WIDTH),
    onLeft("column", far, FIRST_HALF_WIDTH),
    onRight("column_corner", at, FIRST_HALF_WIDTH),
    onRight("column_corner__far", far, FIRST_HALF_WIDTH),
    onLeft(
      wallPiece(CORNER_LENGTH, { columnAtStart: true, columnAtEnd: true }),
      at,
      FIRST_HALF_WIDTH,
    ),
    onLeft("drain", at, FIRST_HALF_WIDTH),
    {
      piece: "wall_end",
      position: [far + END_WALL_OFFSET, 0, -FIRST_HALF_WIDTH],
      rotationY: ACROSS_BACK,
    },
    { piece: "roof_corner", position: [at + CORNER_LENGTH / 2, 0, 0], rotationY: Math.PI },
    {
      piece: "floor_division",
      position: [at + CORNER_LENGTH / 2, 0, FIRST_HALF_WIDTH - COLUMN_INSET],
      rotationY: FACING_FORWARD,
    },
  ]
}

function secondCorridorPlacements(tokens: CorridorToken[]): Placement[] {
  const length = lengthOf(tokens)
  const columnJoints = columnJointsOf(tokens).filter((joint) => joint > LENGTH_TOLERANCE)
  const run = corridorRun(tokens, {
    halfWidth: SECOND_HALF_WIDTH,
    column: "column_narrow",
    drains: false,
    roofs: false,
    cornerJoints: SECOND_CORNER_JOINTS,
  })
  const divisions = columnJoints.map((joint): Placement => ({
    piece: "floor_division",
    position: [joint, 0, 0],
    rotationY: ACROSS_FORWARD,
  }))
  const roofs = Array.from({ length: length / SEGMENT_LENGTH }, (_, index): Placement => ({
    piece: "roof",
    position: [SECOND_ROOF_OFFSET + index * SEGMENT_LENGTH, 0, 0],
    rotationY: FACING_FORWARD,
  }))
  return [
    ...run,
    ...divisions,
    ...roofs,
    ...floorTiles(columnJoints, length),
    { piece: "door", position: [length, 0, 0], rotationY: ACROSS_BACK },
  ]
}

function floorTiles(columnJoints: number[], length: number): Placement[] {
  const stops = columnJoints.filter((joint) => joint < length - LENGTH_TOLERANCE)
  const columnAtEnd = columnJoints.some((joint) => Math.abs(joint - length) < LENGTH_TOLERANCE)
  const bounds = [
    DIVISION_HALF_LENGTH,
    ...stops.flatMap((joint) => [joint - DIVISION_HALF_LENGTH, joint + DIVISION_HALF_LENGTH]),
    length + (columnAtEnd ? -DIVISION_HALF_LENGTH : DIVISION_HALF_LENGTH),
  ]
  const placements: Placement[] = []
  let firstRow = 0
  for (let index = 0; index < bounds.length; index += 2) {
    const rows = tileRows(bounds[index], bounds[index + 1], firstRow)
    placements.push(...rows.placements)
    firstRow += rows.count
  }
  return placements
}

function tileRows(from: number, to: number, firstRow: number) {
  const count = Math.max(1, Math.round((to - from) / TILE_ROW_LENGTH))
  const pitch = (to - from) / count
  const placements = Array.from({ length: count }, (_, row) =>
    Array.from({ length: TILES_ACROSS }, (_, column) =>
      checkerTile(firstRow + row, column, from + (row + 0.5) * pitch),
    ),
  ).flat()
  return { count, placements }
}

function checkerTile(row: number, column: number, along: number): Placement {
  const flip = randomOf(row, column, FLIP_SEED) < 0.5 ? 0 : Math.PI
  return {
    piece: (row + column) % 2 === 0 ? "floor_tile_1" : "floor_tile_2",
    position: [along, 0, (column - (TILES_ACROSS - 1) / 2) * TILE_WIDTH],
    rotationY: TILE_QUARTER_TURN + flip + jitter(row, column, YAW_SEED),
    tilt: [jitter(row, column, TILT_X_SEED), jitter(row, column, TILT_Z_SEED)],
  }
}

function jitter(row: number, column: number, seed: number) {
  return (randomOf(row, column, seed) * 2 - 1) * TILE_JITTER
}

function randomOf(row: number, column: number, seed: number) {
  const value = Math.sin(row * 127.1 + column * 311.7 + seed * 74.7) * 43758.5453
  return value - Math.floor(value)
}

function floorRows(start: number, length: number): Placement[] {
  const coveredLength = length + 2 * FLOOR_OVERHANG_UNDER_DOOR
  const count = Math.ceil(coveredLength / FLOOR_PLANK_ROW_LENGTH)
  return Array.from({ length: count }, (_, index) => ({
    piece: "floor",
    position: [start - FLOOR_OVERHANG_UNDER_DOOR + index * FLOOR_PLANK_ROW_LENGTH, 0, 0],
    rotationY: FACING_FORWARD,
  }))
}

function lengthOf(tokens: CorridorToken[]) {
  return tokens.reduce((sum, token) => sum + (token.kind === "wall" ? token.length : 0), 0)
}

function columnJointsOf(tokens: CorridorToken[]) {
  const joints: number[] = []
  let cursor = 0
  for (const token of tokens) {
    if (token.kind === "column" && !joints.some((joint) => joint === cursor)) joints.push(cursor)
    if (token.kind === "wall") cursor += token.length
  }
  return joints
}

function jointKey(x: number) {
  return x.toFixed(2)
}

function shifted(placement: Placement, by: number): Placement {
  const [x, y, z] = placement.position
  return { ...placement, position: [x + by, y, z] }
}

function turned(placement: Placement, [originX, originZ]: [number, number]): Placement {
  const [x, y, z] = placement.position
  return {
    ...placement,
    position: [originX - z, y, originZ + x],
    rotationY: placement.rotationY + TURN_RIGHT,
  }
}

function onLeft(piece: KitPiece, x: number, halfWidth: number): Placement {
  return { piece, position: [x, 0, -halfWidth], rotationY: FACING_FORWARD }
}

function onRight(piece: KitPiece, x: number, halfWidth: number): Placement {
  return { piece, position: [x, 0, halfWidth], rotationY: FACING_BACK }
}
