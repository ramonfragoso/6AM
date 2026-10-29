import { MathUtils } from "three"
import type { Haunt } from "./haunts"
import { growingPaintingsSettings } from "./hauntSettings"
import type { PaintingSwap } from "./hauntState"

const SCARY_PORTRAIT: readonly PaintingSwap[] = [{ replaced: "papa_original", by: "papa_scary" }]

const SATURN_FOR_READING: readonly PaintingSwap[] = [{ replaced: "reading", by: "saturndevouring" }]

const WIDE_PAIR_SWAPPED: readonly PaintingSwap[] = [
  { replaced: "apilgrimagetosanisidro", by: "witchessabbath" },
  { replaced: "witchessabbath", by: "apilgrimagetosanisidro" },
]

export const SCARY_POPE: Haunt = {
  id: "scaryPope",
  name: "Scary Pope",
  kind: "loud",
  haunt: (state) => {
    state.paintingSwaps = SCARY_PORTRAIT
  },
}

export const SATURN_DEVOURING: Haunt = {
  id: "saturnDevouring",
  name: "Saturn Devouring",
  kind: "subtle",
  haunt: (state) => {
    state.paintingSwaps = SATURN_FOR_READING
  },
}

export const HORIZONTAL_PAINTINGS: Haunt = {
  id: "horizontalPaintings",
  name: "Horizontal Paintings",
  kind: "subtle",
  haunt: (state) => {
    state.paintingSwaps = WIDE_PAIR_SWAPPED
  },
}

export const GROWING_PAINTINGS: Haunt = {
  id: "growingPaintings",
  name: "Growing Paintings",
  kind: "subtle",
  haunt: (state, { sinceManifest }) => {
    const { maxGrowth, seconds } = growingPaintingsSettings
    state.paintingGrowth = MathUtils.lerp(1, maxGrowth, Math.min(1, sinceManifest / seconds))
  },
}
