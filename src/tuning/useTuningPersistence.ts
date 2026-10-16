import { button, levaStore, monitor, useControls } from "leva"
import { useRef, type RefObject } from "react"
import { fetchSavedTuning, writeSavedTuning, type SavedTuning } from "./savedTuning"
import { sameKind } from "./useTuningControls"

const NOT_SAVED_FROM_PANEL = false

const UNSAVED_FOLDER = "Testing"

export function useTuningPersistence() {
  const status = useRef("Values load from public/tuning.json")

  useControls("Tuning", {
    Save: button(() => void save(status)),
    "Revert to saved": button(() => void revert(status)),
    status: monitor(status),
  })
}

async function save(status: RefObject<string>) {
  status.current = "Saving…"
  try {
    const saved = await fetchSavedTuning()
    await writeSavedTuning({ ...saved, ...currentTuning() })
    status.current = `Saved at ${new Date().toLocaleTimeString()}`
  } catch (error) {
    status.current = `Save failed: ${errorMessage(error)}`
  }
}

async function revert(status: RefObject<string>) {
  try {
    const saved = await fetchSavedTuning()
    for (const [path, value] of Object.entries(saved)) {
      const input = levaStore.getInput(path)
      if (input && sameKind(input.value, value)) {
        levaStore.setValueAtPath(path, value, NOT_SAVED_FROM_PANEL)
      }
    }
    status.current = `Reverted at ${new Date().toLocaleTimeString()}`
  } catch (error) {
    status.current = `Revert failed: ${errorMessage(error)}`
  }
}

function currentTuning(): SavedTuning {
  const values = Object.entries(levaStore.getData())
    .filter(([path, item]) => "value" in item && !path.split(".").includes(UNSAVED_FOLDER))
    .map(([path, item]) => [path, (item as { value: unknown }).value])
  return Object.fromEntries(values)
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
