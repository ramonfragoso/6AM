import { Vector3 } from "three"
import { placementMatrix } from "@/kit/KitInstances"
import type { KitPiece, Placement } from "@/kit/kitPieces"
import type { Kit } from "@/kit/useKit"

export const FLAME_GROUPS = ["lanterns", "tiledLantern", "candlestick", "candle"] as const

export type FlameGroup = (typeof FLAME_GROUPS)[number]

const GROUP_OF_PIECE: Partial<Record<KitPiece, FlameGroup>> = {
  lantern: "lanterns",
  square_table_set: "candlestick",
  round_table_set: "candle",
}

const FIRE_ANCHOR = "anchor_fire"

export type FlamePoint = { base: Vector3; scale: number }

export type Flame = FlamePoint & { group: FlameGroup }

export type FlamesByGroup = Record<FlameGroup, Flame[]>

export type PlacementsByGroup = Partial<Record<FlameGroup, Placement[]>>

export function flamesByGroup(
  kit: Kit,
  placements: Placement[],
  placementsByGroup: PlacementsByGroup = {},
): FlamesByGroup {
  const flames = [
    ...placements.flatMap((placement) => flamesOf(kit, placement, GROUP_OF_PIECE[placement.piece])),
    ...FLAME_GROUPS.flatMap((group) =>
      (placementsByGroup[group] ?? []).flatMap((placement) => flamesOf(kit, placement, group)),
    ),
  ]
  return Object.fromEntries(
    FLAME_GROUPS.map((group) => [group, flames.filter((flame) => flame.group === group)]),
  ) as FlamesByGroup
}

function flamesOf(kit: Kit, placement: Placement, group: FlameGroup | undefined): Flame[] {
  if (!group) return []
  return flamePointsOf(kit, placement).map((point) => ({ group, ...point }))
}

export function flamePointsOf(kit: Kit, placement: Placement): FlamePoint[] {
  const matrix = placementMatrix(placement)
  return kit[placement.piece].anchors
    .filter((anchor) => anchor.name.startsWith(FIRE_ANCHOR))
    .map((anchor) => ({
      base: new Vector3().setFromMatrixPosition(matrix.clone().multiply(anchor.matrix)),
      scale: placement.scale ?? 1,
    }))
}

export function flameSize(flame: FlamePoint, { width, height }: { width: number; height: number }) {
  return { width: width * flame.scale, height: height * flame.scale }
}
