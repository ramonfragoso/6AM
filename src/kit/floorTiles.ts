import { secondCorridorTiledArea, secondCorridorTiles } from "./corridorLayout"
import { FIRST_CORRIDOR, SECOND_CORRIDOR } from "./house"
import type { KitPiece, Placement } from "./kitPieces"
import { TILE_CLIP_DIVISIONS, tileClip } from "./kitSurface"

const UNUSED_TILE_DEPTH = -10

export const FLOOR_TILE_PIECES: ReadonlySet<KitPiece> = new Set<KitPiece>([
  "floor_tile_1",
  "floor_tile_2",
])

export const TILE_LAYOUTS = sameCounts(
  secondCorridorTiles(FIRST_CORRIDOR, SECOND_CORRIDOR, false),
  secondCorridorTiles(FIRST_CORRIDOR, SECOND_CORRIDOR, true),
)

export function clipTilesToTiledArea() {
  const area = secondCorridorTiledArea(FIRST_CORRIDOR, SECOND_CORRIDOR)
  if (area.divisions.length > TILE_CLIP_DIVISIONS) {
    throw new Error(`The tile clip holds ${TILE_CLIP_DIVISIONS} Floor Divisions at most`)
  }
  tileClip.origin.value.set(...area.origin)
  tileClip.along.value.set(area.from, area.to)
  tileClip.halfAcross.value = area.halfAcross
  tileClip.divisionHalfLength.value = area.divisionHalfLength
  area.divisions.forEach((division, index) =>
    tileClip.divisions.value.setComponent(index, division),
  )
}

function sameCounts(straight: Placement[], turned: Placement[]) {
  const pieces = [...FLOOR_TILE_PIECES]
  const padded = (layout: Placement[], other: Placement[]) =>
    pieces.flatMap((piece) => {
      const own = layout.filter((placement) => placement.piece === piece)
      const missing = other.filter((placement) => placement.piece === piece).length - own.length
      return [...own, ...Array.from({ length: Math.max(0, missing) }, () => unusedTile(piece))]
    })
  return { straight: padded(straight, turned), turned: padded(turned, straight) }
}

function unusedTile(piece: KitPiece): Placement {
  return {
    piece,
    position: [0, UNUSED_TILE_DEPTH, 0],
    rotationY: 0,
    scale: 0,
  }
}
