import type { Vector3Tuple } from "three"

export const KIT_URL = "/models/kit.glb"

export const KIT_NODE_PREFIX = "kit_"

export const WALL_LENGTHS = [2, 4, 6] as const

export type WallLength = (typeof WALL_LENGTHS)[number]

type ColumnVariant = "" | "__col_start" | "__col_end" | "__col_both"

const WALL_PIECES = [
  "wall_2m__col_both",
  "wall_4m__col_start",
  "wall_4m__col_end",
  "wall_4m__col_both",
  "wall_6m__col_start",
  "wall_6m__col_end",
  "wall_6m__col_both",
] as const

type WallPiece = (typeof WALL_PIECES)[number]

const OTHER_PIECES = [
  "wall_end",
  "column",
  "column_corner",
  "column_corner__far",
  "column_narrow",
  "door",
  "door_frame",
  "drain",
  "roof",
  "roof_corner",
  "floor",
  "floor_tile_1",
  "floor_tile_2",
  "floor_division",
] as const

export const PAINTING_FRAMES = ["painting_frame_1", "painting_frame_2", "painting_frame_3"] as const

export type PaintingFrame = (typeof PAINTING_FRAMES)[number]

export const PROP_PIECES = ["square_table_set", "round_table_set", "chair", "lantern"] as const

export type PropPiece = (typeof PROP_PIECES)[number]

export const CANDLE_SET_PIECES = [
  "candle_set_top_left",
  "candle_set_top_right",
  "candle_set_bottom_left",
  "candle_set_bottom_right",
] as const

export type CandleSetPiece = (typeof CANDLE_SET_PIECES)[number]

export type KitPiece =
  WallPiece | (typeof OTHER_PIECES)[number] | PaintingFrame | PropPiece | CandleSetPiece

export const KIT_PIECES: readonly KitPiece[] = [
  ...WALL_PIECES,
  ...OTHER_PIECES,
  ...PAINTING_FRAMES,
  ...PROP_PIECES,
  ...CANDLE_SET_PIECES,
]

export type Placement = {
  piece: KitPiece
  position: Vector3Tuple
  rotationY: number
  tilt?: readonly [x: number, z: number]
  scale?: number
}

const SOLID_PIECES: ReadonlySet<KitPiece> = new Set<KitPiece>([
  ...WALL_PIECES,
  "wall_end",
  "column",
  "column_corner",
  "column_corner__far",
  "column_narrow",
  "door",
  "door_frame",
  "floor",
  "floor_tile_1",
  "floor_tile_2",
  "floor_division",
  "square_table_set",
  "round_table_set",
  "chair",
])

export function isSolid(piece: KitPiece) {
  return SOLID_PIECES.has(piece)
}

const SHADOWLESS_PIECES: ReadonlySet<KitPiece> = new Set<KitPiece>(["lantern"])

export function castsShadow(piece: KitPiece) {
  return !SHADOWLESS_PIECES.has(piece)
}

export type WallEnds = { columnAtStart: boolean; columnAtEnd: boolean }

export function wallPiece(length: WallLength, { columnAtStart, columnAtEnd }: WallEnds): KitPiece {
  const piece = `wall_${length}m${columnVariant(columnAtStart, columnAtEnd)}`
  if (!isWallPiece(piece)) {
    throw new Error(
      `The Kit has no "${piece}": add it to WALL_PIECES and to PLACED_WALL_VARIANTS in tools/kit/blender/granny_kit/pipeline/parts.py, then export the Kit again`,
    )
  }
  return piece
}

function isWallPiece(piece: string): piece is WallPiece {
  return (WALL_PIECES as readonly string[]).includes(piece)
}

function columnVariant(atStart: boolean, atEnd: boolean): ColumnVariant {
  if (atStart && atEnd) return "__col_both"
  if (atStart) return "__col_start"
  if (atEnd) return "__col_end"
  return ""
}
