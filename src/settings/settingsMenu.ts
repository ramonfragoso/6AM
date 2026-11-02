import { dawnScreenCover } from "@/dawn/dawnScreenCover"
import { eventChannel } from "@/events/eventChannel"
import { reading } from "@/guides/noteReading"
import { nightState } from "@/night/night"
import { title } from "@/title/title"

export type SettingsPage = "main" | "credits"

export type SettingsMenuState = { open: boolean; page: SettingsPage }

const GAME_CANVAS = "canvas"

const CLOSING_GRACE_MS = 150

export const settingsMenu: SettingsMenuState = { open: false, page: "main" }

let closedAt = Number.NEGATIVE_INFINITY

export const settingsMenuEvents = eventChannel<SettingsMenuState>()

export function settingsOpen() {
  return settingsMenu.open || performance.now() - closedAt < CLOSING_GRACE_MS
}

export function inGame() {
  return (
    (title.stage === "opening" || title.stage === "playing") &&
    nightState.phase === "playing" &&
    !dawnScreenCover.coversScene
  )
}

export function canOpenSettings() {
  return inGame() && !settingsMenu.open && !reading()
}

export function canLockPointer() {
  return inGame() && !settingsMenu.open
}

export function openSettings() {
  if (!canOpenSettings()) return
  if (document.pointerLockElement) document.exitPointerLock()
  show({ open: true, page: "main" })
}

export function closeSettings() {
  if (!hideSettings()) return
  if (inGame()) lockGamePointer()
}

export function showSettingsPage(page: SettingsPage) {
  if (settingsMenu.open) show({ open: true, page })
}

export function backOutOfSettings() {
  if (settingsMenu.page === "credits") showSettingsPage("main")
  else closeSettings()
}

export function backOutWithEscape() {
  if (settingsMenu.page === "credits") showSettingsPage("main")
  else hideSettings()
}

function hideSettings() {
  if (!settingsMenu.open) return false
  closedAt = performance.now()
  show({ open: false, page: "main" })
  return true
}

function show(next: SettingsMenuState) {
  Object.assign(settingsMenu, next)
  settingsMenuEvents.emit({ ...settingsMenu })
}

export function lockGamePointer() {
  document.querySelector(GAME_CANVAS)?.requestPointerLock().catch(ignoreRefusedLock)
}

function ignoreRefusedLock() {}
