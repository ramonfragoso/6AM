import { cornerStart, houseDoors } from "./corridorLayout"
import { corridorTokens, FIRST_CORRIDOR_LAYOUT, SECOND_CORRIDOR_LAYOUT } from "./corridorSpec"

export const FIRST_CORRIDOR = corridorTokens(FIRST_CORRIDOR_LAYOUT)

export const SECOND_CORRIDOR = corridorTokens(SECOND_CORRIDOR_LAYOUT)

export const HOUSE_DOORS = houseDoors(FIRST_CORRIDOR, SECOND_CORRIDOR)

export const CORNER_START_X = cornerStart(FIRST_CORRIDOR)
