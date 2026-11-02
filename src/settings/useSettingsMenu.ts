import { type RefObject, useEffect, useRef, useState } from "react"
import { closeReading, reading, readingJustClosed } from "@/guides/noteReading"
import { readGamepad } from "@/input/gamepad"
import {
  dpadVertical,
  type MenuButtons,
  menuButtonsOf,
  RELEASED_MENU_BUTTONS,
  type Repeat,
  repeatedPress,
  sidewaysOf,
  verticalOf,
} from "@/input/menuGamepad"
import { closeLanguageList, languageListOpen, steerLanguageList } from "@/i18n/languageList"
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
  backOutWithEscape,
  canLockPointer,
  canOpenSettings,
  closeSettings,
  inGame,
  lockGamePointer,
  openSettings,
  settingsMenu,
  settingsMenuEvents,
  type SettingsMenuState,
} from "./settingsMenu"

const ESCAPE = "Escape"

const UNLOCK_ESCAPE_GRACE_MS = 300

const TEXT_FIELDS: ReadonlySet<string> = new Set(["INPUT", "TEXTAREA", "SELECT"])

const SCROLL_SCREENS_PER_SECOND = 1.2

const MILLISECONDS = 1000

export function useSettingsMenu(menu: RefObject<HTMLElement | null>) {
  const [state, setState] = useState<SettingsMenuState>({ ...settingsMenu })
  const openedAt = useRef(0)

  useEffect(() => settingsMenuEvents.listen(setState), [])
  useOpenOnPointerUnlock(openedAt)
  useEscapeKey(openedAt)
  useLockOnKey()
  useGamepadMenu(menu)
  useFocusOnPage(menu, state)
  usePlayerVolume()

  return state
}

function useOpenOnPointerUnlock(openedAt: RefObject<number>) {
  useEffect(() => {
    function handleUnlock() {
      if (document.pointerLockElement) return
      closeReading()
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
      if (languageListOpen()) closeLanguageList()
      else if (settingsMenu.open) backOutWithEscape()
      else {
        closeReading()
        if (canOpenSettings()) openSettings()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [openedAt])
}

function useLockOnKey() {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === ESCAPE || event.repeat || document.pointerLockElement) return
      if (typesText(event.target) || !canLockPointer()) return
      lockGamePointer()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
}

function typesText(target: EventTarget | null) {
  return (
    target instanceof HTMLElement && (target.isContentEditable || TEXT_FIELDS.has(target.tagName))
  )
}

function useGamepadMenu(menu: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let held = RELEASED_MENU_BUTTONS
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
        if (pressed("north") && canOpenSettings() && !readingJustClosed()) {
          openSettings()
          if (menu.current) focusFirstRow(menu.current)
        }
        return
      }
      const target = menu.current
      if (!target) return
      if (languageListOpen()) {
        steerLanguageList({
          down: repeatedPress(vertical, verticalOf(gamepad), now),
          press: pressed("south"),
          back: pressed("north") || pressed("east"),
        })
        return
      }
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
      closeLanguageList()
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
