export type Random = () => number

const SEED_RANGE = 2 ** 32

export function seededRandom(seed: number): Random {
  let state = Math.floor(seed * SEED_RANGE) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / SEED_RANGE
  }
}
