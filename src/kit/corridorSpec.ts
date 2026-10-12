import { WALL_LENGTHS, type WallLength } from "./kitPieces"

export type CorridorToken =
  { kind: "frame" } | { kind: "column" } | { kind: "wall"; length: WallLength }

export type ParsedCorridor = { ok: true; tokens: CorridorToken[] } | { ok: false; error: string }

export const FIRST_CORRIDOR_LAYOUT = "6 | 4 F 6"

export const SECOND_CORRIDOR_LAYOUT = "6 | 4 | 6"

const TOKEN_PATTERN = /[DF]|\||\d+|\S/gi

const FIXED_DOORS =
  "Doors are fixed (start of the first Corridor, end of the second). Use F for a Door Frame"

export function parseCorridorSpec(spec: string): ParsedCorridor {
  const words = spec.match(TOKEN_PATTERN) ?? []
  const tokens: CorridorToken[] = []
  for (const word of words) {
    if (word.toUpperCase() === "D") return { ok: false, error: FIXED_DOORS }
    const token = tokenOf(word)
    if (!token) return { ok: false, error: `"${word}" is not a wall length (2, 4, 6), "|" or "F"` }
    tokens.push(token)
  }
  if (!tokens.some((token) => token.kind === "wall")) {
    return { ok: false, error: "A Corridor needs at least one wall" }
  }
  return { ok: true, tokens }
}

export function corridorTokens(layout: string): CorridorToken[] {
  const parsed = parseCorridorSpec(layout)
  if (!parsed.ok) throw new Error(`Corridor Layout "${layout}": ${parsed.error}`)
  return parsed.tokens
}

function tokenOf(word: string): CorridorToken | null {
  if (word.toUpperCase() === "F") return { kind: "frame" }
  if (word === "|") return { kind: "column" }
  const length = Number(word)
  return isWallLength(length) ? { kind: "wall", length } : null
}

function isWallLength(length: number): length is WallLength {
  return (WALL_LENGTHS as readonly number[]).includes(length)
}
