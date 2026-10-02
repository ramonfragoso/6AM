import { useControls } from "leva"
import type { FolderSettings, Schema } from "leva/dist/declarations/src/types"
import { use } from "react"
import { loadInitialTuning, type SavedTuning } from "./savedTuning"

export function useTuningControls<S extends Schema>(
  folder: string,
  schema: S,
  settings?: FolderSettings,
) {
  const saved = use(loadInitialTuning())
  return useControls(folder, withSavedValues(folder, schema, saved), settings)
}

function withSavedValues<S extends Schema>(folder: string, schema: S, saved: SavedTuning): S {
  const entries = Object.entries(schema).map(([key, input]) => {
    const path = `${folder}.${key}`
    if (!(path in saved)) return [key, input]
    return [key, withValue(input, saved[path])]
  })
  return Object.fromEntries(entries) as S
}

function withValue(input: unknown, savedValue: unknown) {
  if (isValueSettings(input)) {
    return sameKind(input.value, savedValue) ? { ...input, value: savedValue } : input
  }
  return sameKind(input, savedValue) ? savedValue : input
}

function isValueSettings(input: unknown): input is { value: unknown } {
  return typeof input === "object" && input !== null && !Array.isArray(input) && "value" in input
}

export function sameKind(defaultValue: unknown, savedValue: unknown) {
  return (
    typeof defaultValue === typeof savedValue &&
    Array.isArray(defaultValue) === Array.isArray(savedValue)
  )
}
