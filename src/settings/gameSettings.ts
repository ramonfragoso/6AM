import { useSyncExternalStore } from "react"
import { MathUtils } from "three"
import { eventChannel } from "@/events/eventChannel"

export const QUALITIES = ["low", "medium", "max"] as const

export type Quality = (typeof QUALITIES)[number]

export type GameSettings = {
  quality: Quality
  bloom: boolean
  depthOfField: boolean
  sensitivity: number
  invertX: boolean
  invertY: boolean
  volume: number
}

export type PixelRatio = number | [number, number]

export const QUALITY_PIXEL_RATIO: Record<Quality, PixelRatio> = {
  low: 0.5,
  medium: 0.8,
  max: [1, 2],
}

const DEFAULT_SETTINGS: GameSettings = {
  quality: "max",
  bloom: true,
  depthOfField: true,
  sensitivity: 0.5,
  invertX: false,
  invertY: false,
  volume: 1,
}

const STORAGE_KEY = "6am.settings"

const SENSITIVITY_OCTAVES = 4

const MIDDLE = 0.5

const changes = eventChannel<GameSettings>()

export let gameSettings: GameSettings = loadSettings()

export function updateSettings(change: Partial<GameSettings>) {
  gameSettings = withinRange({ ...gameSettings, ...change })
  saveSettings(gameSettings)
  changes.emit(gameSettings)
}

export function useGameSettings() {
  return useSyncExternalStore(changes.listen, currentSettings, defaultSettings)
}

export function sensitivityScale(share: number) {
  return 2 ** ((share - MIDDLE) * SENSITIVITY_OCTAVES)
}

export function volumeGain(share: number) {
  return share * share
}

function currentSettings() {
  return gameSettings
}

function defaultSettings() {
  return DEFAULT_SETTINGS
}

function withinRange(settings: GameSettings): GameSettings {
  return {
    ...settings,
    quality: QUALITIES.includes(settings.quality) ? settings.quality : DEFAULT_SETTINGS.quality,
    sensitivity: MathUtils.clamp(settings.sensitivity, 0, 1),
    volume: MathUtils.clamp(settings.volume, 0, 1),
  }
}

function loadSettings(): GameSettings {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}")
    return withinRange({ ...DEFAULT_SETTINGS, ...sameKindsAsDefaults(stored) })
  } catch {
    return DEFAULT_SETTINGS
  }
}

function sameKindsAsDefaults(stored: Record<string, unknown>): Partial<GameSettings> {
  const kept = Object.entries(stored).filter(
    ([key, value]) =>
      key in DEFAULT_SETTINGS &&
      typeof value === typeof DEFAULT_SETTINGS[key as keyof GameSettings],
  )
  return Object.fromEntries(kept)
}

function saveSettings(settings: GameSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}
