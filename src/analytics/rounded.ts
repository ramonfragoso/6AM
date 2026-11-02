const DECIMALS = 10

export function rounded(value: number) {
  return Math.round(value * DECIMALS) / DECIMALS
}
