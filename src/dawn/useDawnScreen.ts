import { useCallback, useEffect, useRef, useState } from "react"
import { readGamepad } from "@/input/gamepad"
import { type InputAxis, readAxis } from "@/input/inputAxis"
import { useHeldKeys } from "@/input/useHeldKeys"
import { startNight } from "@/night/night"
import { nightEvents } from "@/night/nightEvents"
import { fadeAllSound } from "@/sound/audioEngine"
import { dawnTiming } from "./dawnTiming"

export type DawnStage = "hidden" | "fading" | "shown" | "leaving"

const PLAY_AGAIN: InputAxis = {
  negativeKeys: [],
  positiveKeys: ["KeyE", "Enter"],
  gamepad: (gamepad) => (gamepad.pressed("south") ? 1 : 0),
}

const PRESSED = 0.5

const MILLISECONDS = 1000

const SILENT = 0

const FULL_VOLUME = 1

const GAME_CANVAS = "canvas"

export function useDawnScreen() {
  const [stage, setStage] = useState<DawnStage>("hidden")
  const stageRef = useRef<DawnStage>("hidden")
  const timer = useRef<number | undefined>(undefined)
  const heldKeys = useHeldKeys()

  const moveTo = useCallback((next: DawnStage, after?: { stage: DawnStage; seconds: number }) => {
    window.clearTimeout(timer.current)
    stageRef.current = next
    setStage(next)
    if (!after) return
    timer.current = window.setTimeout(() => {
      stageRef.current = after.stage
      setStage(after.stage)
    }, after.seconds * MILLISECONDS)
  }, [])

  useEffect(
    () =>
      nightEvents.listen((event) => {
        if (event.kind === "dawn") {
          document.exitPointerLock()
          fadeAllSound(SILENT, dawnTiming.fadeOut)
          moveTo("fading", {
            stage: "shown",
            seconds: dawnTiming.fadeOut + dawnTiming.buttonDelay,
          })
        }
        if (event.kind === "newNight" && stageRef.current !== "hidden") {
          fadeAllSound(FULL_VOLUME, dawnTiming.fadeIn)
          moveTo("leaving", { stage: "hidden", seconds: dawnTiming.fadeIn })
        }
      }),
    [moveTo],
  )

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const playAgain = useCallback(() => {
    if (stageRef.current !== "shown") return
    document.querySelector(GAME_CANVAS)?.requestPointerLock().catch(ignoreRefusedLock)
    startNight()
  }, [])

  usePlayAgainPress(stage === "shown", heldKeys, playAgain)

  const fadeSeconds = stage === "leaving" ? dawnTiming.fadeIn : dawnTiming.fadeOut
  return { stage, playAgain, fadeSeconds }
}

function usePlayAgainPress(
  listening: boolean,
  heldKeys: ReturnType<typeof useHeldKeys>,
  playAgain: () => void,
) {
  useEffect(() => {
    if (!listening) return
    const isHeld = () => readAxis(PLAY_AGAIN, heldKeys.current, readGamepad()) > PRESSED
    let wasHeld = isHeld()
    let frame = 0
    const poll = () => {
      const held = isHeld()
      if (held && !wasHeld) playAgain()
      wasHeld = held
      frame = window.requestAnimationFrame(poll)
    }
    frame = window.requestAnimationFrame(poll)
    return () => window.cancelAnimationFrame(frame)
  }, [listening, heldKeys, playAgain])
}

function ignoreRefusedLock() {}
