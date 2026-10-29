import { useFrame } from "@react-three/fiber"
import { useMemo, useState } from "react"
import { hauntState } from "@/haunts/hauntState"
import type { CorridorToken } from "@/kit/corridorSpec"
import { usePlacedPieces } from "@/kit/placedPieces"
import type { Kit } from "@/kit/useKit"
import { hangHousePaintings } from "./hangPaintings"
import { usePaintingsTuning } from "./usePaintingsTuning"

const GROWTH_STEP = 0.001

export function useHungPaintings(kit: Kit, first: CorridorToken[]) {
  const { glass, arrangements } = usePaintingsTuning()
  const { swaps, growth } = useHauntedPaintings()
  const hung = useMemo(
    () => hangHousePaintings(kit, first, swaps, growth, arrangements),
    [kit, first, swaps, growth, arrangements],
  )
  const frames = useMemo(() => hung.map((painting) => painting.placement), [hung])
  usePlacedPieces("paintings", frames)
  return { hung, frames, glass }
}

function useHauntedPaintings() {
  const [swaps, setSwaps] = useState(hauntState.paintingSwaps)
  const [growth, setGrowth] = useState(hauntState.paintingGrowth)
  useFrame(() => {
    if (hauntState.paintingSwaps !== swaps) setSwaps(hauntState.paintingSwaps)
    const steppedGrowth = Math.round(hauntState.paintingGrowth / GROWTH_STEP) * GROWTH_STEP
    if (steppedGrowth !== growth) setGrowth(steppedGrowth)
  })
  return { swaps, growth }
}
