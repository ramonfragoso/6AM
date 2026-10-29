import { useEffect } from "react"
import type { Placement } from "./kitPieces"

export type PlacedGroup = "paintings" | "furniture" | "candleSets"

export const placedPieces: Record<PlacedGroup, readonly Placement[]> = {
  paintings: [],
  furniture: [],
  candleSets: [],
}

export function usePlacedPieces(group: PlacedGroup, placements: readonly Placement[]) {
  useEffect(() => {
    placedPieces[group] = placements
  }, [group, placements])
}
