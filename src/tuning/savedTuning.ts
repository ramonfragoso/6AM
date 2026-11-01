import fallbackTuning from "./fallbackTuning.json"

export type SavedTuning = Record<string, unknown>

const TUNING_API_URL = "/api/tuning"

const TUNING_FILE_URL = "/tuning.json"

let initialTuning: Promise<SavedTuning> | null = null

export function loadInitialTuning() {
  initialTuning ??= fetchTuningFile()
  return initialTuning
}

async function fetchTuningFile(): Promise<SavedTuning> {
  try {
    const response = await fetch(TUNING_FILE_URL, { cache: "no-store" })
    if (!response.ok) return fallbackTuning
    const saved: SavedTuning = await response.json()
    return { ...fallbackTuning, ...saved }
  } catch {
    return fallbackTuning
  }
}

export async function fetchSavedTuning(): Promise<SavedTuning> {
  const response = await fetch(TUNING_API_URL, { cache: "no-store" })
  if (!response.ok) return {}
  return response.json()
}

export async function writeSavedTuning(tuning: SavedTuning) {
  const response = await fetch(TUNING_API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tuning),
  })
  if (!response.ok) throw new Error(await response.text())
}
