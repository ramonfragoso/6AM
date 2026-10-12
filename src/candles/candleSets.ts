import type { CandleSetPiece } from "@/kit/kitPieces"
import type { LitFlame } from "@/props/FlameLights"
import type { FlameLightSettings } from "@/props/useFlamesTuning"
import type { FurnitureSpot } from "@/props/propPlacements"

export type CandleSetLight = { lightHeight: number; light1X: number; light1Z: number }

export type CandleSetSpot = FurnitureSpot & { light: CandleSetLight }

export type CandleSetSpots = Record<CandleSetPiece, CandleSetSpot>

const SHADOWLESS_LIGHT_SETS: ReadonlySet<CandleSetPiece> = new Set<CandleSetPiece>([
  "candle_set_top_left",
  "candle_set_top_right",
])

export function candleSetLights(spots: CandleSetSpots, light: FlameLightSettings): LitFlame[] {
  return Object.entries(spots).map(([piece, spot]) => ({
    position: [spot.light.light1X, spot.light.lightHeight, spot.light.light1Z],
    light,
    castShadow: !SHADOWLESS_LIGHT_SETS.has(piece as CandleSetPiece),
  }))
}
