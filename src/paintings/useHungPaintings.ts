import { useMemo } from "react"
import type { CorridorToken } from "@/kit/corridorSpec"
import type { Kit } from "@/kit/useKit"
import { hangHousePaintings } from "./hangPaintings"
import { usePaintingsTuning } from "./usePaintingsTuning"

export function useHungPaintings(kit: Kit, first: CorridorToken[]) {
  const { glass, swaps, arrangements } = usePaintingsTuning()
  const hung = useMemo(
    () => hangHousePaintings(kit, first, swaps, arrangements),
    [kit, first, swaps, arrangements],
  )
  const frames = useMemo(() => hung.map((painting) => painting.placement), [hung])
  return { hung, frames, glass }
}
