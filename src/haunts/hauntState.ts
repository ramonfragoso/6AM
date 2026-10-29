import type { Cockroaches } from "@/cockroaches/cockroachWalk"
import type { DoorAjar } from "@/doorWall/doorAjar"
import type { DoorRattle } from "@/doorWall/doorRattle"
import type { GhostAttack } from "@/ghost/ghost"
import type { PaintingName } from "@/paintings/paintings"
import type { ChairMove } from "@/props/chairMove"
import type { VoidDoor } from "@/void/voidDoor"

export type PaintingSwap = { replaced: PaintingName; by: PaintingName }

export type HauntState = {
  houseLight: number
  houseTint: number
  houseTintColor: number
  ambiencePitch: number
  firstAmbience: number
  secondAmbience: number
  paintingSwaps: readonly PaintingSwap[]
  paintingGrowth: number
  crucifixInverted: boolean
  coatRackBare: boolean
  tilesTurned: boolean
  clutterSeed: number | null
  doorRattle: DoorRattle | null
  chairMove: ChairMove | null
  doorAjar: DoorAjar | null
  voidDoor: VoidDoor | null
  ghostAttack: GhostAttack | null
  cockroaches: Cockroaches | null
}

export const NO_PAINTING_SWAPS: readonly PaintingSwap[] = []

export const CLEAN_HAUNT_STATE: Readonly<HauntState> = {
  houseLight: 1,
  houseTint: 0,
  houseTintColor: 0xffffff,
  ambiencePitch: 0,
  firstAmbience: 1,
  secondAmbience: 1,
  paintingSwaps: NO_PAINTING_SWAPS,
  paintingGrowth: 1,
  crucifixInverted: false,
  coatRackBare: false,
  tilesTurned: false,
  clutterSeed: null,
  doorRattle: null,
  chairMove: null,
  doorAjar: null,
  voidDoor: null,
  ghostAttack: null,
  cockroaches: null,
}

export const hauntState: HauntState = { ...CLEAN_HAUNT_STATE }

export function resetHauntState() {
  Object.assign(hauntState, CLEAN_HAUNT_STATE)
}
