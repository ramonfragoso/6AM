import { hauntCountText } from "@/i18n/text"
import { useFrame } from "@react-three/fiber"
import { type RefObject, useCallback, useRef } from "react"
import { MathUtils } from "three"
import { useViewpoint } from "@/debugPlayer/useViewpoint"
import { strangling } from "@/ghost/strangleView"
import { readGamepad } from "@/input/gamepad"
import { readAxis, type InputAxis } from "@/input/inputAxis"
import { useDeviceData } from "@/input/useDeviceData"
import { useHeldKeys } from "@/input/useHeldKeys"
import { nightState } from "@/night/night"
import { loopState } from "@/passage/loopState"
import { playerPose } from "@/player/playerPose"
import { settingsOpen } from "@/settings/settingsMenu"
import { playing } from "@/title/title"
import { READ_NOTES_PRIORITY } from "@/world/physicsSettings"
import { hauntsLeft, type Note } from "./guides"
import { aimedNote, noteReading } from "./noteReading"
import { type ReadingSettings, useReadingTuning } from "./useGuidesTuning"

export const READING_DARK_PROPERTY = "--reading-dark"

export const READING_TEXT_PROPERTY = "--reading-text"

export const HAUNT_COUNT_TEXT_ATTRIBUTE = "data-haunt-count-text"

const TOGGLE: InputAxis = {
  negativeKeys: [],
  positiveKeys: ["KeyE"],
  gamepad: (gamepad) => (gamepad.pressed("south") ? 1 : 0),
}

const CLOSE: InputAxis = { negativeKeys: [], positiveKeys: ["Escape"], gamepad: () => 0 }

const PRESSED = 0.5

const SHOWN = 1

const HIDDEN = 0

type Fade = { shown: number; dark: number; text: number }

export function useNoteReading(overlay: RefObject<HTMLElement | null>) {
  const settings = useReadingTuning()
  const viewed = useViewpoint() === "Player"
  const readControls = useReadingControls()
  const fade = useRef<Fade>({ shown: HIDDEN, dark: -1, text: -1 })

  useDeviceData(overlay)

  useFrame((_, delta) => {
    const { toggle, close } = readControls()
    const free = viewed && canRead()
    if (!free) noteReading.open = null
    const open = noteReading.open
    noteReading.aimed = free && !open ? aimedNote(playerPose.eye, playerPose.yaw, settings) : null
    if (open && (toggle || close)) {
      noteReading.open = null
      noteReading.aimed = open
    } else if (!open && toggle && noteReading.aimed) {
      showNote(overlay.current, noteReading.aimed)
      noteReading.open = noteReading.aimed
      noteReading.aimed = null
    }
    advanceFade(fade.current, noteReading.open !== null, delta, settings)
    writeFade(overlay.current, fade.current, settings)
  }, READ_NOTES_PRIORITY)
}

function useReadingControls() {
  const heldKeys = useHeldKeys()
  const wasHeld = useRef({ toggle: false, close: false })

  return useCallback(() => {
    const gamepad = readGamepad()
    const toggle = readAxis(TOGGLE, heldKeys.current, gamepad) > PRESSED
    const close = readAxis(CLOSE, heldKeys.current, gamepad) > PRESSED
    const pressed = {
      toggle: toggle && !wasHeld.current.toggle,
      close: close && !wasHeld.current.close,
    }
    wasHeld.current = { toggle, close }
    return pressed
  }, [heldKeys])
}

function canRead() {
  return (
    playing() &&
    nightState.phase === "playing" &&
    loopState.whereabouts === "startRoom" &&
    !loopState.passing &&
    !strangling() &&
    !settingsOpen()
  )
}

function showNote(element: HTMLElement | null, note: Note) {
  if (!element) return
  element.dataset.note = note
  const text = element.querySelector(`[${HAUNT_COUNT_TEXT_ATTRIBUTE}]`)
  if (text && note === "hauntCount") text.textContent = hauntCountText(hauntsLeft())
}

function advanceFade(
  fade: Fade,
  open: boolean,
  delta: number,
  { fadeIn, fadeOut }: ReadingSettings,
) {
  const step = delta / (open ? fadeIn : fadeOut)
  const target = open ? SHOWN : HIDDEN
  fade.shown = MathUtils.clamp(target, fade.shown - step, fade.shown + step)
}

function writeFade(
  element: HTMLElement | null,
  fade: Fade,
  { darkness, textDelay }: ReadingSettings,
) {
  if (!element) return
  const dark = darkness * MathUtils.smootherstep(fade.shown, 0, 1)
  const text = MathUtils.smootherstep(fade.shown, textDelay, 1)
  if (dark !== fade.dark) element.style.setProperty(READING_DARK_PROPERTY, `${dark}`)
  if (text !== fade.text) element.style.setProperty(READING_TEXT_PROPERTY, `${text}`)
  fade.dark = dark
  fade.text = text
}
