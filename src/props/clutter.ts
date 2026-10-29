import { MathUtils, Vector3 } from "three"
import { DOOR_WALL_INDEX, DOOR_WALL_SIDE } from "@/doorWall/doorWall"
import {
  SECOND_CORRIDOR_HALF_WIDTH,
  secondCorridorPoint,
  secondCorridorSpot,
  secondCorridorTiledArea,
  type TileRun,
  type WallSide,
} from "@/kit/corridorLayout"
import { FIRST_CORRIDOR, SECOND_CORRIDOR } from "@/kit/house"
import { type Random, seededRandom } from "@/random/seededRandom"

export const CLUTTER_VARIANTS = ["book", "darkBottle", "glassBottle", "smallGlassBottle"] as const

export type ClutterVariant = (typeof CLUTTER_VARIANTS)[number]

export type ClutterPose = "standing" | "lying"

export type ClutterItem = {
  variant: ClutterVariant
  pose: ClutterPose
  position: Vector3
  yaw: number
  scale: number
}

export type ClutterSizes = Record<ClutterVariant, Vector3>

export type ScatterSettings = { count: number; onLedges: number }

export type Obstacle = { x: number; z: number; radius: number }

type Spot = {
  along: number
  across: number
  height: number
  radius: number
}

type Ledge = TileRun & { side: WallSide }

const AREA = secondCorridorTiledArea(FIRST_CORRIDOR, SECOND_CORRIDOR)

const CLUTTER_START = AREA.from + 0.2

const CLUTTER_END = middleOf(AREA.runs[DOOR_WALL_INDEX])

const FLOOR_MARGIN = 0.12

const LEDGE_HEIGHT = 1.001

const LEDGE_INSET = 0.125

const LEDGE_MARGIN = 0.1

const LEDGE_DIAMETER = 0.11

const BOOK_SHARE = 0.45

const LYING_BOOKS = 0.8

const LYING_BOTTLES = 0.45

const FLOOR_SCALE = [0.8, 1.25] as const

const TRIES = 40

const BOTTLES: readonly ClutterVariant[] = ["darkBottle", "glassBottle", "smallGlassBottle"]

const LEDGES: readonly Ledge[] = (["left", "right"] as const).flatMap((side) =>
  AREA.runs
    .filter((_, index) => !(side === DOOR_WALL_SIDE && index === DOOR_WALL_INDEX))
    .map((run) => ({
      side,
      from: Math.max(run.from, CLUTTER_START) + LEDGE_MARGIN,
      to: Math.min(run.to, CLUTTER_END) - LEDGE_MARGIN,
    }))
    .filter((ledge) => ledge.to > ledge.from),
)

export function scatterClutter(
  seed: number,
  { count, onLedges }: ScatterSettings,
  sizes: ClutterSizes,
  obstacles: readonly Obstacle[],
): ClutterItem[] {
  const random = seededRandom(seed)
  const taken: Spot[] = obstacles.map(obstacleSpot)
  const items: ClutterItem[] = []
  for (let made = 0; made < count; made++) {
    const variant = random() < BOOK_SHARE ? "book" : BOTTLES[Math.floor(random() * BOTTLES.length)]
    const onLedge = variant !== "book" && LEDGES.length > 0 && random() < onLedges
    const item = onLedge
      ? ledgeItem(variant, sizes[variant], random, taken)
      : floorItem(variant, sizes[variant], random, taken)
    if (item) items.push(item)
  }
  return items
}

export function footprintOf(size: Vector3, pose: ClutterPose) {
  return pose === "standing" ? Math.hypot(size.x, size.z) / 2 : Math.hypot(size.y, size.z) / 2
}

function floorItem(
  variant: ClutterVariant,
  size: Vector3,
  random: Random,
  taken: Spot[],
): ClutterItem | null {
  const pose = random() < (variant === "book" ? LYING_BOOKS : LYING_BOTTLES) ? "lying" : "standing"
  const scale = MathUtils.lerp(...FLOOR_SCALE, random())
  const radius = footprintOf(size, pose) * scale
  const reach = AREA.halfAcross - FLOOR_MARGIN - radius
  const spot = freeSpot(taken, radius, 0, random, () => [
    MathUtils.lerp(CLUTTER_START, CLUTTER_END, random()),
    MathUtils.lerp(-reach, reach, random()),
  ])
  return spot && itemAt(variant, pose, spot, scale, random)
}

function ledgeItem(
  variant: ClutterVariant,
  size: Vector3,
  random: Random,
  taken: Spot[],
): ClutterItem | null {
  const ledge = LEDGES[Math.floor(random() * LEDGES.length)]
  const scale = Math.min(MathUtils.lerp(...FLOOR_SCALE, random()), LEDGE_DIAMETER / size.x)
  const radius = footprintOf(size, "standing") * scale
  const across = (SECOND_CORRIDOR_HALF_WIDTH - LEDGE_INSET) * (ledge.side === "left" ? -1 : 1)
  const spot = freeSpot(taken, radius, LEDGE_HEIGHT, random, () => [
    MathUtils.lerp(ledge.from, ledge.to, random()),
    across,
  ])
  return spot && itemAt(variant, "standing", spot, scale, random)
}

function freeSpot(
  taken: Spot[],
  radius: number,
  height: number,
  random: Random,
  pick: () => [along: number, across: number],
): Spot | null {
  for (let tried = 0; tried < TRIES; tried++) {
    const [along, across] = pick()
    const spot = {
      along,
      across,
      height,
      radius,
    }
    if (taken.every((other) => apart(spot, other))) {
      taken.push(spot)
      return spot
    }
  }
  return null
}

function obstacleSpot({ x, z, radius }: Obstacle): Spot {
  const [along, across] = secondCorridorSpot(FIRST_CORRIDOR, x, z)
  return {
    along,
    across,
    height: 0,
    radius,
  }
}

function apart(spot: Spot, other: Spot) {
  if (spot.height !== other.height) return true
  return (
    Math.hypot(spot.along - other.along, spot.across - other.across) >= spot.radius + other.radius
  )
}

function itemAt(
  variant: ClutterVariant,
  pose: ClutterPose,
  { along, across, height }: Spot,
  scale: number,
  random: Random,
): ClutterItem {
  const [x, z] = secondCorridorPoint(FIRST_CORRIDOR, along, across)
  return {
    variant,
    pose,
    position: new Vector3(x, height, z),
    yaw: random() * Math.PI * 2,
    scale,
  }
}

function middleOf({ from, to }: TileRun) {
  return (from + to) / 2
}
