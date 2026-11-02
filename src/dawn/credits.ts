import { MathUtils } from "three"

export type CreditEntry = { work: string; by: string; license: string }

export type CreditSection = { heading: string; entries: CreditEntry[] }

export type CreditsTiming = {
  musicDelay: number
  musicFadeIn: number
  settle: number
  rollStart: number
  rollCentered: number
  buttonDelay: number
}

export type CreditsMoment = {
  white: number
  title: boolean
  byline: boolean
  rollShare: number
  playAgain: boolean
}

export type RollSizes = {
  viewport: number
  content: number
  gap: number
  closing: number
}

export type RollPlacement = { contentY: number; closingY: number }

type Card = { from: number; to: number }

export const ENDING_MUSIC_CUES = {
  firstHeavy: 13.23,
  firstClean: 23.25,
  drums: 26.57,
  secondHeavy: 38.04,
  darker: 66.6,
  lastClean: 106.6,
  end: 132.9,
}

const TITLE_CARD: Card = { from: ENDING_MUSIC_CUES.firstHeavy, to: ENDING_MUSIC_CUES.firstClean }

const BYLINE_CARD: Card = { from: ENDING_MUSIC_CUES.drums, to: ENDING_MUSIC_CUES.secondHeavy }

const HALF = 0.5

export const GAME_TITLE = "6AM"

export const BYLINE = { lead: "A game by", name: "Ramon Fragoso" }

export const DEVELOPER_CREDIT = { role: "Developer", name: BYLINE.name }

export const CLOSING_LINE = "Thank you for playing"

export const BELOW_SCREEN = { transform: "translateY(100vh)" }

const CC_BY = "CC BY 4.0"

const ROYALTY_FREE = "BlenderKit Royalty Free"

const CC0 = "CC0"

const PUBLIC_DOMAIN = "Public domain"

export const CREDIT_SECTIONS: CreditSection[] = [
  {
    heading: "Music",
    entries: [
      {
        work: "4 Ghosts I, from Ghosts I–IV",
        by: "Nine Inch Nails",
        license: "CC BY-NC-SA 3.0",
      },
    ],
  },
  {
    heading: "Models",
    entries: [
      { work: "Gothic crucifix", by: "Virtual Museums of Małopolska", license: CC_BY },
      { work: "Coat Rack", by: "martn00", license: CC_BY },
      { work: "Low Poly hanging cloth 5", by: "-Arthur-", license: CC_BY },
      { work: "Bowler hat", by: "Mylom", license: CC_BY },
      { work: "Giant cockroach", by: "Drillimpact", license: CC_BY },
      { work: "Male body reference", by: "Rex Mun", license: CC0 },
      { work: "Old Style Table", by: "Nikhil Mathavan", license: ROYALTY_FREE },
      { work: "European Baroque Chandelier", by: "Lucas Vasseur", license: ROYALTY_FREE },
      { work: "Side Elegant Table", by: "Szymon Styrczula", license: ROYALTY_FREE },
      { work: "Wood chair A", by: "Jan Pavlic", license: ROYALTY_FREE },
      { work: "Lantern", by: "Antoine Bagattini", license: ROYALTY_FREE },
      { work: "Clock alarm dekad", by: "M X", license: ROYALTY_FREE },
      { work: "Ceiling lamp", by: "BlenderKit Community", license: ROYALTY_FREE },
      { work: "Candle holder with candle and flame", by: "Dennis Hafemann", license: ROYALTY_FREE },
      { work: "Yellow candle", by: "stray designer", license: ROYALTY_FREE },
      { work: "Old leather book", by: "Reza NeoMasyaf", license: ROYALTY_FREE },
      { work: "Old Book: Julius Caesar", by: "Joshua Whitney", license: CC0 },
      { work: "Short and Tall Glass Bottles", by: "Loren Fitts", license: ROYALTY_FREE },
      { work: "Empty bottle 1.75l dark", by: "Mat Karmon", license: ROYALTY_FREE },
    ],
  },
  {
    heading: "Materials",
    entries: [
      { work: "Painted Plaster Wall", by: "chroma 3D", license: ROYALTY_FREE },
      { work: "Polished Walnut Wood", by: "Jair Del Real", license: ROYALTY_FREE },
      { work: "Glossy Dark Oak Wood", by: "Lal Mohan", license: ROYALTY_FREE },
      { work: "Oak Wood2", by: "yossif kh", license: ROYALTY_FREE },
      { work: "Heavily Rusted Iron", by: "KID", license: ROYALTY_FREE },
      { work: "Stylized Metal Panels", by: "Julio Sillet", license: ROYALTY_FREE },
      { work: "Floral Granite Stone Engraving", by: "Vaishakh Vinod", license: ROYALTY_FREE },
      { work: "Realistic damaged glass", by: "Steffen", license: ROYALTY_FREE },
      { work: "White-grey crystal glass", by: "ydd 3D", license: ROYALTY_FREE },
      { work: "Brass/gold scratched metal", by: "ydd 3D", license: ROYALTY_FREE },
      { work: "Wood", by: "ydd 3D", license: ROYALTY_FREE },
      { work: "Wood Streaked Black", by: "James Middleton", license: ROYALTY_FREE },
      { work: "Furniture Wood", by: "Cynicalitz G", license: ROYALTY_FREE },
      { work: "Glossy Sage Green tiles", by: "antoine f", license: ROYALTY_FREE },
    ],
  },
  {
    heading: "Paintings",
    entries: [
      {
        work: "Saturn Devouring His Son, Witches' Sabbath, A Pilgrimage to San Isidro, Two Monks, Women Laughing, Men Reading",
        by: "Francisco de Goya",
        license: PUBLIC_DOMAIN,
      },
      { work: "Portrait of Innocent X", by: "Diego Velázquez", license: PUBLIC_DOMAIN },
      {
        work: "Study after Velázquez's Portrait of Pope Innocent X",
        by: "Francis Bacon",
        license: "© The Estate of Francis Bacon",
      },
    ],
  },
  {
    heading: "Animation and Sound",
    entries: [
      { work: "Ghost animations", by: "Mixamo", license: "Adobe Mixamo" },
      { work: "UI Mechanical Text-Scroll", by: "InspectorJ, freesound.org", license: CC_BY },
    ],
  },
  {
    heading: "Type and Code",
    entries: [
      { work: "Cinzel Decorative", by: "Natanael Gama", license: "SIL Open Font License" },
      { work: "three-fire", by: "wolffo", license: "MIT" },
      { work: "three.js", by: "three.js authors", license: "MIT" },
      { work: "React Three Fiber", by: "Poimandres", license: "MIT" },
      { work: "Rapier", by: "Dimforge", license: "Apache 2.0" },
      { work: "Next.js", by: "Vercel", license: "MIT" },
      { work: "Blender", by: "Blender Foundation", license: "GPL" },
    ],
  },
]

export function creditsMoment(seconds: number, timing: CreditsTiming): CreditsMoment {
  const { settle, rollStart, rollCentered, buttonDelay } = timing
  return {
    white: 1 - MathUtils.smoothstep(seconds, 0, settle),
    title: cardShown(seconds, TITLE_CARD),
    byline: cardShown(seconds, BYLINE_CARD),
    rollShare: Math.max((seconds - rollStart) / (rollCentered - rollStart), 0),
    playAgain: seconds >= rollCentered + buttonDelay,
  }
}

export function rollPlacement(
  share: number,
  { viewport, content, gap, closing }: RollSizes,
): RollPlacement {
  const centeredClosingY = (viewport - closing) * HALF
  const travelled = share * (viewport + content + gap - centeredClosingY)
  const contentY = viewport - travelled
  return { contentY, closingY: Math.max(contentY + content + gap, centeredClosingY) }
}

function cardShown(seconds: number, { from, to }: Card) {
  return seconds >= from && seconds < to
}
