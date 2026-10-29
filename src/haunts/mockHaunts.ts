import type { Haunt } from "./haunts"
import { reachedCorner } from "./triggers"

const LOUD_MOCKS = 10

const MOCK_ID_PREFIX = "haunt"

export function mockHaunts(first: number, last: number): Haunt[] {
  return Array.from({ length: last - first + 1 }, (_, index) => mockHaunt(first + index))
}

function mockHaunt(number: number): Haunt {
  return {
    id: `${MOCK_ID_PREFIX}${number}`,
    name: `Haunt ${number}`,
    kind: number <= LOUD_MOCKS ? "loud" : "subtle",
    trigger: isEven(number) ? reachedCorner : undefined,
  }
}

function isEven(number: number) {
  return number % 2 === 0
}

export function isMockHaunt(haunt: Haunt) {
  return haunt.id.startsWith(MOCK_ID_PREFIX)
}
