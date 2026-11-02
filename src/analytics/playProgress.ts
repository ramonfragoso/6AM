type Snapshot = () => Record<string, unknown>

export const playProgress: { playingSince: number | null; snapshot: Snapshot | null } = {
  playingSince: null,
  snapshot: null,
}
