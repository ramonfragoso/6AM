import { type RefObject, useEffect, useRef, useState } from "react"
import { closeReading, reading } from "@/guides/noteReading"
import { type GamepadState, readGamepad } from "@/input/gamepad"
import { setPlayerVolume } from "@/sound/audioEngine"
import { useGameSettings, volumeGain } from "./gameSettings"
import {
  adjustFocused,
  focusFirstRow,
  MENU_SCROLL,
  moveFocus,
  pressFocused,
  scrollMenu,
} from "./menuNavigation"
import {
  backOutOfSettings,
  canOpenSettings,
  closeSettings,
  inGame,
  openSettings,
  settingsMenu,
  settingsMenuEvents,
  type SettingsMenuState,
} from "./settingsMenu"

const ESCAPE = "Escape"

const UNLOCK_ESCAPE_GRACE_MS = 300

const STICK_PRESS = 0.5

const FIRST_REPEAT_MS = 400

const NEXT_REPEAT_MS = 110

const SCROLL_SCREENS_PER_SECOND = 1.2

const MILLISECONDS = 1000

type Repeat = { direction: number; nextAt: number }

type MenuButtons = { north: boolean; east: boolean; south: boolean }

const RELEASED: MenuButtons = { north: false, east: false, south: false }

export function useSettingsMenu(menu: RefObject<HTMLElement | null>) {
  const [state, setState] = useState<SettingsMenuState>({ ...settingsMenu })
  const openedAt = useRef(0)

  useEffect(() => settingsMenuEvents.listen(setState), [])
  useOpenOnPointerUnlock(openedAt)
  useEscapeKey(openedAt)
  useGamepadMenu(menu)
  useFocusOnPage(menu, state)
  usePlayerVolume()

  return state
}

function useOpenOnPointerUnlock(openedAt: RefObject<number>) {
  useEffect(() => {
    function handleUnlock() {
      if (document.pointerLockElement) return
      if (reading()) {
        closeReading()
        return
      }
      if (!canOpenSettings()) return
      openedAt.current = performance.now()
      openSettings()
    }

    document.addEventListener("pointerlockchange", handleUnlock)
    return () => document.removeEventListener("pointerlockchange", handleUnlock)
  }, [openedAt])
}

function useEscapeKey(openedAt: RefObject<number>) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== ESCAPE || event.repeat || document.pointerLockElement) return
      if (performance.now() - openedAt.current < UNLOCK_ESCAPE_GRACE_MS) return
      if (settingsMenu.open) backOutOfSettings()
      else if (canOpenSettings()) openSettings()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [openedAt])
}

function useGamepadMenu(menu: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let held = RELEASED
    const vertical: Repeat = { direction: 0, nextAt: 0 }
    const sideways: Repeat = { direction: 0, nextAt: 0 }
    let last = performance.now()
    let frame = 0

    const poll = () => {
      frame = window.requestAnimationFrame(poll)
      const now = performance.now()
      const seconds = (now - last) / MILLISECONDS
      last = now
      if (settingsMenu.open && !inGame()) closeSettings()
      const gamepad = readGamepad()
      const buttons = menuButtonsOf(gamepad)
      const pressed = (button: keyof MenuButtons) => buttons[button] && !held[button]
      held = buttons
      if (!settingsMenu.open) {
        if (pressed("north") && canOpenSettings()) {
          openSettings()
          if (menu.current) focusFirstRow(menu.current)
        }
        return
      }
      const target = menu.current
      if (!target) return
      if (pressed("north") || pressed("east")) {
        backOutOfSettings()
        return
      }
      if (settingsMenu.page === "credits") {
        if (pressed("south")) backOutOfSettings()
        const scroll = -gamepad.leftStick.y - gamepad.rightStick.y + dpadVertical(gamepad)
        scrollMenu(target, scroll * window.innerHeight * SCROLL_SCREENS_PER_SECOND * seconds)
        return
      }
      if (pressed("south")) pressFocused(target)
      const down = repeatedPress(vertical, verticalOf(gamepad), now)
      if (down) moveFocus(target, down)
      const right = repeatedPress(sideways, sidewaysOf(gamepad), now)
      if (right) adjustFocused(target, right)
    }

    frame = window.requestAnimationFrame(poll)
    return () => window.cancelAnimationFrame(frame)
  }, [menu])
}

function useFocusOnPage(menu: RefObject<HTMLElement | null>, { open, page }: SettingsMenuState) {
  useEffect(() => {
    const target = menu.current
    if (!target) return
    if (!open) {
      if (target.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
      return
    }
    if (page === "credits") target.querySelector<HTMLElement>(`[${MENU_SCROLL}]`)?.focus()
  }, [menu, open, page])
}

function usePlayerVolume() {
  const { volume } = useGameSettings()
  useEffect(() => setPlayerVolume(volumeGain(volume)), [volume])
}

function menuButtonsOf(gamepad: GamepadState): MenuButtons {
  return {
    north: gamepad.pressed("north"),
    east: gamepad.pressed("east"),
    south: gamepad.pressed("south"),
  }
}

function dpadVertical(gamepad: GamepadState) {
  return (gamepad.pressed("dpadDown") ? 1 : 0) - (gamepad.pressed("dpadUp") ? 1 : 0)
}

function verticalOf(gamepad: GamepadState) {
  const dpad = dpadVertical(gamepad)
  if (dpad !== 0) return dpad
  return stickDirection(-gamepad.leftStick.y)
}

function sidewaysOf(gamepad: GamepadState) {
  const dpad = (gamepad.pressed("dpadRight") ? 1 : 0) - (gamepad.pressed("dpadLeft") ? 1 : 0)
  if (dpad !== 0) return dpad
  return stickDirection(gamepad.leftStick.x)
}

function stickDirection(tilt: number) {
  if (Math.abs(tilt) < STICK_PRESS) return 0
  return Math.sign(tilt)
}

function repeatedPress(repeat: Repeat, direction: number, now: number) {
  if (direction === 0) {
    repeat.direction = 0
    return 0
  }
  if (direction !== repeat.direction) {
    repeat.direction = direction
    repeat.nextAt = now + FIRST_REPEAT_MS
    return direction
  }
  if (now < repeat.nextAt) return 0
  repeat.nextAt = now + NEXT_REPEAT_MS
  return direction
}
