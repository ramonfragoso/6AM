import type { PaintingFrame, Placement } from "@/kit/kitPieces"

export const PAINTINGS = {
  papa_original: "painting_frame_1",
  papa_scary: "painting_frame_1",
  apilgrimagetosanisidro: "painting_frame_2",
  witchessabbath: "painting_frame_2",
  reading: "painting_frame_3",
  twowomaneating: "painting_frame_3",
  saturndevouring: "painting_frame_3",
  twomonks: "painting_frame_3",
} as const satisfies Record<string, PaintingFrame>

export type PaintingName = keyof typeof PAINTINGS

export const PAINTING_NAMES = Object.keys(PAINTINGS) as PaintingName[]

export type HungPainting = {
  painting: PaintingName
  frame: PaintingFrame
  placement: Placement
}

const PAINTINGS_URL = "/models/paintings"

export function paintingUrl(painting: PaintingName, version: string) {
  return `${PAINTINGS_URL}/${painting}.ktx2${version}`
}
