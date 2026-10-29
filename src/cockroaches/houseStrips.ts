import { Box3, Vector3 } from "three"
import { DOOR_WALL_INDEX, DOOR_WALL_SIDE } from "@/doorWall/doorWall"
import {
  endWall,
  FIRST_CORRIDOR_HALF_WIDTH,
  houseLayout,
  SECOND_CORRIDOR_HALF_WIDTH,
  SECOND_CORRIDOR_ROOF_START,
  secondCorridorPoint,
  secondCorridorSpot,
  secondCorridorWall,
} from "@/kit/corridorLayout"
import { CORNER_START_X, FIRST_CORRIDOR, HOUSE_DOORS, SECOND_CORRIDOR } from "@/kit/house"
import { collisionBoxes } from "@/kit/KitColliders"
import { placementMatrix } from "@/kit/KitInstances"
import type { KitPiece, Placement } from "@/kit/kitPieces"
import type { PlacedGroup } from "@/kit/placedPieces"
import type { Kit } from "@/kit/useKit"
import { coatRackCollider, coatRackObstacle, coatRackPlacement } from "@/props/coatRack"
import type { FurnitureSpot } from "@/props/propPlacements"
import {
  BASEBOARD_INSET,
  corridorProfile,
  PLASTER_INSET,
  type Profile,
  type Rect,
  type Region,
  rectsOf,
  regionOf,
  type Strip,
} from "./surfaceMap"

export type LiveObstacles = Record<PlacedGroup, readonly Placement[]> & { coatRack: FurnitureSpot }

const OBSTACLE_PIECES: ReadonlySet<KitPiece> = new Set<KitPiece>([
  "column",
  "column_corner",
  "column_corner__far",
  "column_narrow",
  "door_frame",
])

const OBSTACLE_MARGIN = 0.035

const CORNER_ROOF_BELOW = 3.2

const SEAM_CLEARANCE = 0.001

const EVERYWHERE = 100

const PORTAL_MARGIN = 0.05

const PORTAL_BACKOFF = 0.15

const FIRST_STRIP = 0

const SECOND_STRIP = 1

export function houseStrips(kit: Kit): Strip[] {
  const strips = [firstStrip(), secondStrip()]
  const boxes = houseObstacleBoxes(kit)
  return strips.map((strip) => {
    const fixed = [...strip.fixed, ...boxes.flatMap((box) => rectsAround(strip, box))]
    return { ...strip, fixed, blocked: fixed }
  })
}

export function withLiveObstacles(strips: Strip[], kit: Kit, live: LiveObstacles) {
  const boxes = liveObstacleBoxes(kit, live)
  for (const strip of strips) {
    strip.blocked = [...strip.fixed, ...boxes.flatMap((box) => rectsAround(strip, box))]
  }
}

function firstStrip(): Strip {
  const profile = corridorProfile(FIRST_CORRIDOR_HALF_WIDTH)
  const origin = new Vector3(-CORNER_START_X, 0, 0)
  const corner = 2 * CORNER_START_X
  const to = endWall(FIRST_CORRIDOR).position[0] + PLASTER_INSET - BASEBOARD_INSET - origin.x
  return {
    profile,
    origin,
    along: new Vector3(1, 0, 0),
    across: new Vector3(0, 0, 1),
    from: 0,
    to,
    fixed: cornerRects(profile, corner, to + EVERYWHERE, corner, to + EVERYWHERE),
    blocked: [],
    portal: { from: corner + PORTAL_MARGIN, to: to - PORTAL_MARGIN, into: SECOND_STRIP },
  }
}

function secondStrip(): Strip {
  const profile = corridorProfile(SECOND_CORRIDOR_HALF_WIDTH)
  const [originX, originZ] = secondCorridorPoint(FIRST_CORRIDOR, 0, 0)
  const [alongX, alongZ] = secondCorridorPoint(FIRST_CORRIDOR, 1, 0)
  const [acrossX, acrossZ] = secondCorridorPoint(FIRST_CORRIDOR, 0, 1)
  const cornerWallBase = -(FIRST_CORRIDOR_HALF_WIDTH - BASEBOARD_INSET)
  const [from] = secondCorridorSpot(FIRST_CORRIDOR, originX, cornerWallBase)
  const [crucifixDoorX, , crucifixDoorZ] = HOUSE_DOORS.end.position
  const [to] = secondCorridorSpot(FIRST_CORRIDOR, crucifixDoorX, crucifixDoorZ)
  return {
    profile,
    origin: new Vector3(originX, 0, originZ),
    along: new Vector3(alongX - originX, 0, alongZ - originZ),
    across: new Vector3(acrossX - originX, 0, acrossZ - originZ),
    from,
    to,
    fixed: cornerRects(
      profile,
      from - EVERYWHERE,
      SECOND_CORRIDOR_ROOF_START,
      from - EVERYWHERE,
      0,
    ),
    blocked: [],
    portal: { from: from + PORTAL_MARGIN, to: -PORTAL_BACKOFF, into: FIRST_STRIP },
  }
}

function cornerRects(
  profile: Profile,
  roofFrom: number,
  roofTo: number,
  openFrom: number,
  openTo: number,
): Rect[] {
  const roof: Region = {
    from: roofFrom,
    to: roofTo,
    acrossMin: -EVERYWHERE,
    acrossMax: EVERYWHERE,
    below: CORNER_ROOF_BELOW,
    above: EVERYWHERE,
  }
  const opening: Region = {
    from: openFrom,
    to: openTo,
    acrossMin: profile.floorHalf + SEAM_CLEARANCE,
    acrossMax: EVERYWHERE,
    below: SEAM_CLEARANCE,
    above: EVERYWHERE,
  }
  return [...rectsOf(profile, roof), ...rectsOf(profile, opening)]
}

function rectsAround(strip: Strip, box: Box3) {
  const region = regionOf(strip, box, OBSTACLE_MARGIN)
  if (region.to < strip.from || region.from > strip.to) return []
  return rectsOf(strip.profile, region)
}

function houseObstacleBoxes(kit: Kit) {
  const doorWall = secondCorridorWall(
    FIRST_CORRIDOR,
    SECOND_CORRIDOR,
    DOOR_WALL_INDEX,
    DOOR_WALL_SIDE,
  )
  const standing = houseLayout(FIRST_CORRIDOR, SECOND_CORRIDOR).filter((placement) =>
    OBSTACLE_PIECES.has(placement.piece),
  )
  return [...standing, doorWall].flatMap((placement) =>
    collisionBoxes(placement.piece, kit[placement.piece].bounds).map((box) =>
      worldBox(box, placement),
    ),
  )
}

function liveObstacleBoxes(kit: Kit, live: LiveObstacles) {
  const pieces = [...live.paintings, ...live.furniture, ...live.candleSets]
    .filter((placement) => !kit[placement.piece].bounds.isEmpty())
    .map((placement) => worldBox(kit[placement.piece].bounds, placement))
  return [...pieces, coatRackBox(live.coatRack)]
}

function worldBox(box: Box3, placement: Placement) {
  return box.clone().applyMatrix4(placementMatrix(placement))
}

function coatRackBox(spot: FurnitureSpot) {
  const { x, z, radius } = coatRackObstacle(spot)
  const {
    args: [halfHeight],
  } = coatRackCollider(coatRackPlacement(spot))
  return new Box3(
    new Vector3(x - radius, 0, z - radius),
    new Vector3(x + radius, 2 * halfHeight, z + radius),
  )
}
