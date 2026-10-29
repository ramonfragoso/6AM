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

const TURNED_TILE_YAW = Math.PI / 4

const TILE_REACH = Math.hypot(TILE_WIDTH, TILE_ROW_LENGTH) / 2

const HALF_TILED_WIDTH = (TILES_ACROSS * TILE_WIDTH) / 2

const FLIP_SEED = 1

const YAW_SEED = 2

const TILT_X_SEED = 3

const TILT_Z_SEED = 4

const FLOOR_OVERHANG_UNDER_END_WALL = 0.54

export const FLOOR_PLANK_ROW_LENGTH = 2.505

const FACING_FORWARD = 0

const FACING_BACK = Math.PI

const ACROSS_FORWARD = Math.PI / 2

const ACROSS_BACK = -Math.PI / 2

const TURN_RIGHT = -Math.PI / 2

const LENGTH_TOLERANCE = 1e-3

export const SECOND_CORRIDOR_START_Z = FIRST_HALF_WIDTH - COLUMN_INSET

const SECOND_CORNER_JOINTS = [0]

export type WallSide = "left" | "right"

export type WallSpot = { position: Vector3Tuple; rotationY: number; length: number }

export type DoorSpot = { position: Vector3Tuple; rotationY: number }

export type HouseDoors = { start: DoorSpot; end: DoorSpot }

export type TileRun = { from: number; to: number }

export type TiledArea = {
  origin: [x: number, z: number]
  from: number
  to: number
  halfAcross: number
  runs: TileRun[]
  divisions: number[]
  divisionHalfLength: number
}

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
    ...firstCorridor,
    ...cornerPlacements(corner),
    ...floorRows(start, firstLength + CORNER_LENGTH),
    ...secondCorridor,
  ]
}

export function houseDoors(first: CorridorToken[], second: CorridorToken[]): HouseDoors {
  return {
    start: { position: [-lengthOf(first) / 2, 0, 0], rotationY: ACROSS_FORWARD },
    end: turned(
      { position: [lengthOf(second), 0, 0], rotationY: ACROSS_BACK },
      secondCorridorOrigin(first),
    ),
  }
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
  return [lengthOf(first) / 2 + CORNER_LENGTH / 2, SECOND_CORRIDOR_START_Z]
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

export function cornerStart(first: CorridorToken[]) {
  return lengthOf(first) / 2
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
  const columnJoints = secondColumnJoints(tokens)
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
  return [...run, ...divisions, ...roofs, ...floorTiles(columnJoints, length)]
}

function floorTiles(columnJoints: number[], length: number): Placement[] {
  const placements: Placement[] = []
  let firstRow = 0
  for (const run of tileRuns(columnJoints, length)) {
    const rows = tileRows(run.from, run.to, firstRow)
    placements.push(...rows.placements)
    firstRow += rows.count
  }
  return placements
}

function tileRuns(columnJoints: number[], length: number): TileRun[] {
  const stops = innerJoints(columnJoints, length)
  const columnAtEnd = columnJoints.some((joint) => Math.abs(joint - length) < LENGTH_TOLERANCE)
  const bounds = [
    DIVISION_HALF_LENGTH,
    ...stops.flatMap((joint) => [joint - DIVISION_HALF_LENGTH, joint + DIVISION_HALF_LENGTH]),
    columnAtEnd ? length - DIVISION_HALF_LENGTH : length,
  ]
  return Array.from({ length: bounds.length / 2 }, (_, index) => ({
    from: bounds[2 * index],
    to: bounds[2 * index + 1],
  }))
}

function innerJoints(columnJoints: number[], length: number) {
  return columnJoints.filter((joint) => joint < length - LENGTH_TOLERANCE)
}

export function secondCorridorTiles(
  first: CorridorToken[],
  second: CorridorToken[],
  turnedTiles: boolean,
): Placement[] {
  const length = lengthOf(second)
  const columnJoints = secondColumnJoints(second)
  const tiles = turnedTiles
    ? diagonalFloorTiles(tileRuns(columnJoints, length), length)
    : floorTiles(columnJoints, length)
  return tiles.map((placement) => turned(placement, secondCorridorOrigin(first)))
}

export function secondCorridorTiledArea(
  first: CorridorToken[],
  second: CorridorToken[],
): TiledArea {
  const length = lengthOf(second)
  const runs = tileRuns(secondColumnJoints(second), length)
  return {
    origin: secondCorridorOrigin(first),
    from: runs[0].from,
    to: runs[runs.length - 1].to,
    halfAcross: HALF_TILED_WIDTH,
    runs,
    divisions: innerJoints(secondColumnJoints(second), length),
    divisionHalfLength: DIVISION_HALF_LENGTH,
  }
}

export function secondCorridorPoint(
  first: CorridorToken[],
  along: number,
  across: number,
): [x: number, z: number] {
  const [originX, originZ] = secondCorridorOrigin(first)
  return [originX - across, originZ + along]
}

export function secondCorridorSpot(
  first: CorridorToken[],
  x: number,
  z: number,
): [along: number, across: number] {
  const [originX, originZ] = secondCorridorOrigin(first)
  return [z - originZ, originX - x]
}

export const SECOND_CORRIDOR_HALF_WIDTH = SECOND_HALF_WIDTH

export const FIRST_CORRIDOR_HALF_WIDTH = FIRST_HALF_WIDTH

export const SECOND_CORRIDOR_ROOF_START = SECOND_ROOF_OFFSET

function secondColumnJoints(second: CorridorToken[]) {
  return columnJointsOf(second).filter((joint) => joint > LENGTH_TOLERANCE)
}

function diagonalFloorTiles(runs: TileRun[], length: number): Placement[] {
  const yaw = TILE_QUARTER_TURN + TURNED_TILE_YAW
  const across: [number, number] = [Math.cos(yaw) * TILE_WIDTH, -Math.sin(yaw) * TILE_WIDTH]
  const along: [number, number] = [Math.sin(yaw) * TILE_ROW_LENGTH, Math.cos(yaw) * TILE_ROW_LENGTH]
  const middle = length / 2
  const reach = Math.hypot(middle, HALF_TILED_WIDTH) + TILE_REACH
  const steps = Math.ceil(reach / Math.min(TILE_WIDTH, TILE_ROW_LENGTH))
  const placements: Placement[] = []
  for (let column = -steps; column <= steps; column++) {
    for (let row = -steps; row <= steps; row++) {
      const x = middle + column * across[0] + row * along[0]
      const z = column * across[1] + row * along[1]
      if (touchesRuns(runs, x, z)) placements.push(checkerTile(row, column, x, z, yaw))
    }
  }
  return placements
}

function touchesRuns(runs: TileRun[], x: number, z: number) {
  return (
    Math.abs(z) < HALF_TILED_WIDTH + TILE_REACH &&
    runs.some(({ from, to }) => x > from - TILE_REACH && x < to + TILE_REACH)
  )
}

function tileRows(from: number, to: number, firstRow: number) {
  const count = Math.max(1, Math.round((to - from) / TILE_ROW_LENGTH))
  const pitch = (to - from) / count
  const placements = Array.from({ length: count }, (_, row) =>
    Array.from({ length: TILES_ACROSS }, (_, column) =>
      checkerTile(
        firstRow + row,
        column,
        from + (row + 0.5) * pitch,
        (column - (TILES_ACROSS - 1) / 2) * TILE_WIDTH,
        TILE_QUARTER_TURN,
      ),
    ),
  ).flat()
  return { count, placements }
}

function checkerTile(
  row: number,
  column: number,
  along: number,
  across: number,
  yaw: number,
): Placement {
  const flip = randomOf(row, column, FLIP_SEED) < 0.5 ? 0 : Math.PI
  return {
    piece: isEven(row + column) ? "floor_tile_1" : "floor_tile_2",
    position: [along, 0, across],
    rotationY: yaw + flip + jitter(row, column, YAW_SEED),
    tilt: [jitter(row, column, TILT_X_SEED), jitter(row, column, TILT_Z_SEED)],
  }
}

function isEven(value: number) {
  return ((value % 2) + 2) % 2 === 0
}

function jitter(row: number, column: number, seed: number) {
  return (randomOf(row, column, seed) * 2 - 1) * TILE_JITTER
}

function randomOf(row: number, column: number, seed: number) {
  const value = Math.sin(row * 127.1 + column * 311.7 + seed * 74.7) * 43758.5453
  return value - Math.floor(value)
}

function floorRows(start: number, length: number): Placement[] {
  const coveredLength = length + FLOOR_OVERHANG_UNDER_END_WALL
  const count = Math.ceil(coveredLength / FLOOR_PLANK_ROW_LENGTH)
  return Array.from({ length: count }, (_, index) => ({
    piece: "floor",
    position: [start + index * FLOOR_PLANK_ROW_LENGTH, 0, 0],
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

function turned<Spot extends DoorSpot>(spot: Spot, [originX, originZ]: [number, number]): Spot {
  const [x, y, z] = spot.position
  return {
    ...spot,
    position: [originX - z, y, originZ + x],
    rotationY: spot.rotationY + TURN_RIGHT,
  }
}

function onLeft(piece: KitPiece, x: number, halfWidth: number): Placement {
  return { piece, position: [x, 0, -halfWidth], rotationY: FACING_FORWARD }
}

function onRight(piece: KitPiece, x: number, halfWidth: number): Placement {
  return { piece, position: [x, 0, halfWidth], rotationY: FACING_BACK }
}
