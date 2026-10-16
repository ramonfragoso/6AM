import type { Haunt } from "./haunts"
import { reachedCorner } from "./triggers"

const MOCK_COUNT = 20

const LOUD_MOCKS = 10

export const MOCK_HAUNTS: readonly Haunt[] = Array.from({ length: MOCK_COUNT }, (_, index) =>
  mockHaunt(index + 1),
)

function mockHaunt(number: number): Haunt {
  return {
    id: `haunt${number}`,
    name: `Haunt ${number}`,
    kind: number <= LOUD_MOCKS ? "loud" : "subtle",
    trigger: isEven(number) ? reachedCorner : undefined,
  }
}

function isEven(number: number) {
  return number % 2 === 0
}
