import { type RefObject, useCallback, useEffect, useRef, useState } from "react"
import {
  closeLanguageList,
  LANGUAGE_PICKER,
  languageListOpen,
  steerLanguageList,
} from "@/i18n/languageList"
import { readGamepad } from "@/input/gamepad"
import { type InputAxis, readAxis } from "@/input/inputAxis"
import {
  menuButtonsOf,
  type Repeat,
  repeatedPress,
  sidewaysOf,
  verticalOf,
} from "@/input/menuGamepad"
import { type HeldKeys, useHeldKeys } from "@/input/useHeldKeys"
import { adjustFocused, moveFocus, pressFocused } from "@/settings/menuNavigation"
import { beginOpening, title, type TitleStage, titleEvents } from "./title"
import { titleSettings } from "./titleSettings"

const PLAY_KEY: InputAxis = { negativeKeys: [], positiveKeys: ["KeyE"], gamepad: () => 0 }

const ENTER_KEY: InputAxis = { negativeKeys: [], positiveKeys: ["Enter"], gamepad: () => 0 }

const PRESSED = 0.5

const MILLISECONDS = 1000

const GAME_CANVAS = "canvas"

export function useTitleScreen() {
  const menu = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<TitleStage>(title.stage)
  const [playable, setPlayable] = useState(false)
  const heldKeys = useHeldKeys()

  useEffect(() => titleEvents.listen(setStage), [])

  useEffect(() => {
    if (stage !== "shown") {
      setPlayable(false)
      closeLanguageList()
      return
    }
    const timer = window.setTimeout(() => setPlayable(true), titleSettings.playDelay * MILLISECONDS)
    return () => window.clearTimeout(timer)
  }, [stage])

  const play = useCallback(() => {
    if (title.stage !== "shown") return
    closeLanguageList()
    document.querySelector(GAME_CANVAS)?.requestPointerLock().catch(ignoreRefusedLock)
    beginOpening()
  }, [])

  useTitleInput(playable, menu, heldKeys, play)

  return {
    menu,
    stage,
    playable,
    play,
    settings: titleSettings,
  }
}

function useTitleInput(
  listening: boolean,
  menu: RefObject<HTMLElement | null>,
  heldKeys: { current: HeldKeys },
  play: () => void,
) {
  useEffect(() => {
    if (!listening) return
    const playKey = edgeOf(PLAY_KEY, heldKeys)
    const enterKey = edgeOf(ENTER_KEY, heldKeys)
    let held = menuButtonsOf(readGamepad())
    const vertical: Repeat = { direction: 0, nextAt: 0 }
    const sideways: Repeat = { direction: 0, nextAt: 0 }
    let frame = 0

    const poll = () => {
      frame = window.requestAnimationFrame(poll)
      const now = performance.now()
      const played = playKey()
      const entered = enterKey()
      if (!languageListOpen() && (played || (entered && !pickerFocused()))) play()
      const gamepad = readGamepad()
      const buttons = menuButtonsOf(gamepad)
      const south = buttons.south && !held.south
      const back = (buttons.east && !held.east) || (buttons.north && !held.north)
      held = buttons
      const target = menu.current
      if (!target) return
      const down = repeatedPress(vertical, verticalOf(gamepad), now)
      if (languageListOpen()) {
        steerLanguageList({ down, press: south, back })
        return
      }
      if (down) moveFocus(target, down)
      const right = repeatedPress(sideways, sidewaysOf(gamepad), now)
      if (right) adjustFocused(target, right)
      if (!south) return
      if (target.contains(document.activeElement)) pressFocused(target)
      else play()
    }

    frame = window.requestAnimationFrame(poll)
    return () => window.cancelAnimationFrame(frame)
  }, [listening, menu, heldKeys, play])
}

function edgeOf(axis: InputAxis, heldKeys: { current: HeldKeys }) {
  const isHeld = () => readAxis(axis, heldKeys.current, readGamepad()) > PRESSED
  let wasHeld = isHeld()
  return () => {
    const held = isHeld()
    const pressed = held && !wasHeld
    wasHeld = held
    return pressed
  }
}

function pickerFocused() {
  return document.activeElement?.hasAttribute(LANGUAGE_PICKER) ?? false
}

function ignoreRefusedLock() {}
