import { useCallback, useEffect, useState } from "react"
import { readGamepad } from "@/input/gamepad"
import { type InputAxis, readAxis } from "@/input/inputAxis"
import { type HeldKeys, useHeldKeys } from "@/input/useHeldKeys"
import { beginOpening, title, type TitleStage, titleEvents } from "./title"
import { titleSettings } from "./titleSettings"

const PLAY: InputAxis = {
  negativeKeys: [],
  positiveKeys: ["KeyE", "Enter"],
  gamepad: (gamepad) => (gamepad.pressed("south") ? 1 : 0),
}

const PRESSED = 0.5

const MILLISECONDS = 1000

const GAME_CANVAS = "canvas"

export function useTitleScreen() {
  const [stage, setStage] = useState<TitleStage>(title.stage)
  const [playable, setPlayable] = useState(false)
  const heldKeys = useHeldKeys()

  useEffect(() => titleEvents.listen(setStage), [])

  useEffect(() => {
    if (stage !== "shown") {
      setPlayable(false)
      return
    }
    const timer = window.setTimeout(() => setPlayable(true), titleSettings.playDelay * MILLISECONDS)
    return () => window.clearTimeout(timer)
  }, [stage])

  const play = useCallback(() => {
    if (title.stage !== "shown") return
    document.querySelector(GAME_CANVAS)?.requestPointerLock().catch(ignoreRefusedLock)
    beginOpening()
  }, [])

  usePlayPress(playable, heldKeys, play)

  return {
    stage,
    playable,
    play,
    settings: titleSettings,
  }
}

function usePlayPress(listening: boolean, heldKeys: { current: HeldKeys }, play: () => void) {
  useEffect(() => {
    if (!listening) return
    const isHeld = () => readAxis(PLAY, heldKeys.current, readGamepad()) > PRESSED
    let wasHeld = isHeld()
    let frame = 0
    const poll = () => {
      const held = isHeld()
      if (held && !wasHeld) play()
      wasHeld = held
      frame = window.requestAnimationFrame(poll)
    }
    frame = window.requestAnimationFrame(poll)
    return () => window.cancelAnimationFrame(frame)
  }, [listening, heldKeys, play])
}

function ignoreRefusedLock() {}
