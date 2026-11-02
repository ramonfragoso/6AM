import { type RefObject, useCallback, useEffect, useRef, useState } from "react"
import { readGamepad } from "@/input/gamepad"
import { useLastInputDevice } from "@/input/useLastInputDevice"
import { type InputAxis, readAxis } from "@/input/inputAxis"
import { useHeldKeys } from "@/input/useHeldKeys"
import { startNight } from "@/night/night"
import { nightEvents } from "@/night/nightEvents"
import { playerPose } from "@/player/playerPose"
import { fadeBuses } from "@/sound/audioEngine"
import { BUSES, type Bus } from "@/sound/sounds"
import { creditsMoment, type CreditsMoment, rollPlacement } from "./credits"
import { creditsLook, creditsTextShadow, rollTextShadow } from "./creditsLook"
import { dawnEvents } from "./dawnEvents"
import { dawnsReached, recordDawn } from "./dawnsReached"
import { clearDawnLight, dawnLight, whitenessAt } from "./dawnLight"
import { dawnLightSettings } from "./dawnLightSettings"
import { coverScene } from "./dawnScreenCover"
import { dawnTiming } from "./dawnTiming"
import { endingMusicSeconds, startEndingMusic, stopEndingMusic } from "./endingMusic"

export type DawnStage = "hidden" | "credits" | "shown" | "leaving"

export type CreditsParts = {
  screen: RefObject<HTMLDivElement | null>
  white: RefObject<HTMLDivElement | null>
  title: RefObject<HTMLParagraphElement | null>
  byline: RefObject<HTMLDivElement | null>
  roll: RefObject<HTMLDivElement | null>
  closing: RefObject<HTMLDivElement | null>
}

type MusicState = "waiting" | "playing" | "silent"

type MeasuredHeights = { content: number; closing: number }

type CreditsClock = {
  since: number
  from: number
  music: MusicState
  skippedBy: number
}

export type SkipState = "none" | "offered" | "used"

const PLAY_AGAIN: InputAxis = {
  negativeKeys: [],
  positiveKeys: ["KeyE", "Enter"],
  gamepad: (gamepad) => (gamepad.pressed("south") ? 1 : 0),
}

const SKIP: InputAxis = {
  negativeKeys: [],
  positiveKeys: ["KeyE"],
  gamepad: (gamepad) => (gamepad.pressed("west") ? 1 : 0),
}

const NOT_SKIPPED = 0

const PRESSED = 0.5

const MILLISECONDS = 1000

const SILENT = 0

const FULL_VOLUME = 1

const FADED_IN_THE_LIGHT: readonly Bus[] = ["effects", "ambience"]

const SECONDS_TO_WAIT_FOR_MUSIC = 4

const UNLIT = 0

const GAME_CANVAS = "canvas"

const CLOSING_GAP_SHARE = 0.25

const COVERING_STAGES: ReadonlySet<DawnStage> = new Set(["credits", "shown"])

const SHOWN = 1

const HIDDEN = 0

const CLEARED: CreditsMoment = {
  white: 0,
  title: false,
  byline: false,
  rollShare: 0,
  playAgain: false,
}

export function useDawnScreen() {
  const [stage, setStage] = useState<DawnStage>("hidden")
  const [skipState, setSkipState] = useState<SkipState>("none")
  const skipButton = useRef<HTMLButtonElement>(null)
  const stageRef = useRef<DawnStage>("hidden")
  const timer = useRef<number | undefined>(undefined)
  const clock = useRef<CreditsClock | null>(null)
  const heldKeys = useHeldKeys()
  const parts: CreditsParts = {
    screen: useRef<HTMLDivElement>(null),
    white: useRef<HTMLDivElement>(null),
    title: useRef<HTMLParagraphElement>(null),
    byline: useRef<HTMLDivElement>(null),
    roll: useRef<HTMLDivElement>(null),
    closing: useRef<HTMLDivElement>(null),
  }

  const enterStage = useCallback((next: DawnStage) => {
    stageRef.current = next
    coverScene(COVERING_STAGES.has(next))
    setStage(next)
  }, [])

  const moveTo = useCallback(
    (next: DawnStage, after?: { stage: DawnStage; seconds: number }) => {
      window.clearTimeout(timer.current)
      enterStage(next)
      if (!after) return
      timer.current = window.setTimeout(() => enterStage(after.stage), after.seconds * MILLISECONDS)
    },
    [enterStage],
  )

  const rollCredits = useCallback(
    (from: number, musicDelay: number, skippable: boolean) => {
      stopEndingMusic()
      document.exitPointerLock()
      fadeBuses(FADED_IN_THE_LIGHT, SILENT, dawnTiming.fadeOut)
      clock.current = {
        since: secondsNow() - musicDelay,
        from,
        music: "waiting",
        skippedBy: NOT_SKIPPED,
      }
      setSkipState(skippable ? "offered" : "none")
      moveTo("credits")
    },
    [moveTo],
  )

  useEffect(
    () =>
      nightEvents.listen((event) => {
        if (event.kind === "dawn") {
          const beatenBefore = dawnsReached() > 0
          recordDawn()
          rollCredits(0, 0, beatenBefore)
        }
        if (event.kind === "newNight" && stageRef.current !== "hidden") {
          stopEndingMusic()
          clearDawnLight()
          clock.current = null
          fadeBuses(BUSES, FULL_VOLUME, dawnTiming.fadeIn)
          moveTo("leaving", { stage: "hidden", seconds: dawnTiming.fadeIn })
        }
      }),
    [moveTo, rollCredits],
  )

  useEffect(
    () =>
      dawnEvents.listen(({ from }) => {
        clearDawnLight()
        rollCredits(from, dawnTiming.musicDelay, dawnsReached() > 0)
      }),
    [rollCredits],
  )

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useCreditsFrames(parts, stageRef, clock, moveTo)

  const playAgain = useCallback(() => {
    if (stageRef.current !== "shown") return
    document.querySelector(GAME_CANVAS)?.requestPointerLock().catch(ignoreRefusedLock)
    startNight()
  }, [])

  const skip = useCallback(() => {
    const running = clock.current
    if (!running || stageRef.current !== "credits") return
    running.skippedBy = Math.max(dawnTiming.rollCentered - creditsSeconds(running), NOT_SKIPPED)
    setSkipState("used")
  }, [])

  const skipOffered = skipState === "offered" && stage === "credits"
  usePress(stage === "shown", PLAY_AGAIN, heldKeys, playAgain)
  usePress(skipOffered, SKIP, heldKeys, skip)
  useDeviceOf(skipButton, skipOffered)

  return {
    stage,
    parts,
    playAgain,
    skip,
    skipOffered,
    skipButton,
    fadeSeconds: dawnTiming.fadeIn,
  }
}

function useCreditsFrames(
  parts: CreditsParts,
  stage: RefObject<DawnStage>,
  clock: RefObject<CreditsClock | null>,
  moveTo: (next: DawnStage) => void,
) {
  const { screen, white, title, byline, roll, closing } = parts
  const heights = useMeasuredHeights(roll, closing)
  useEffect(() => {
    let frame = 0
    const draw = () => {
      frame = window.requestAnimationFrame(draw)
      if (stage.current === "hidden") {
        setOpacity(white.current, lightWhiteness())
        return
      }
      const running = clock.current
      const moment = running
        ? creditsMoment(creditsSeconds(running) + running.skippedBy, dawnTiming)
        : CLEARED
      applyLook(screen.current)
      setOpacity(white.current, moment.white)
      setOpacity(title.current, moment.title ? SHOWN : HIDDEN)
      setOpacity(byline.current, moment.byline ? SHOWN : HIDDEN)
      placeRoll(roll.current, closing.current, heights.current, moment.rollShare)
      if (moment.playAgain && stage.current === "credits") moveTo("shown")
    }
    frame = window.requestAnimationFrame(draw)
    return () => window.cancelAnimationFrame(frame)
  }, [screen, white, title, byline, roll, closing, heights, stage, clock, moveTo])
}

function useMeasuredHeights(
  roll: RefObject<HTMLElement | null>,
  closing: RefObject<HTMLElement | null>,
) {
  const heights = useRef<MeasuredHeights>({ content: 0, closing: 0 })
  useEffect(() => {
    const measure = () => {
      heights.current = {
        content: roll.current?.offsetHeight ?? 0,
        closing: closing.current?.offsetHeight ?? 0,
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (roll.current) observer.observe(roll.current)
    if (closing.current) observer.observe(closing.current)
    return () => observer.disconnect()
  }, [roll, closing])
  return heights
}

function creditsSeconds(clock: CreditsClock) {
  if (clock.music === "waiting") startMusicWhenDue(clock)
  const waited = secondsWaited(clock)
  if (clock.music === "playing") return endingMusicSeconds() ?? clock.from + waited
  if (clock.music === "silent") return clock.from + waited
  return clock.from + Math.min(waited, 0)
}

function startMusicWhenDue(clock: CreditsClock) {
  const waited = secondsWaited(clock)
  if (waited < 0) return
  if (startEndingMusic(clock.from, dawnTiming.musicFadeIn)) clock.music = "playing"
  else if (waited > SECONDS_TO_WAIT_FOR_MUSIC) {
    clock.music = "silent"
    clock.since += waited
  }
}

function secondsWaited(clock: CreditsClock) {
  return secondsNow() - clock.since - dawnTiming.musicDelay
}

function lightWhiteness() {
  const { doorway } = dawnLight
  return doorway ? whitenessAt(playerPose.eye, doorway, dawnLightSettings) : UNLIT
}

function setOpacity(element: HTMLElement | null, opacity: number) {
  if (!element) return
  const value = String(opacity)
  if (element.style.opacity !== value) element.style.opacity = value
}

function placeRoll(
  content: HTMLElement | null,
  closing: HTMLElement | null,
  heights: MeasuredHeights,
  share: number,
) {
  if (!content || !closing) return
  const viewport = window.innerHeight
  const { contentY, closingY } = rollPlacement(share, {
    viewport,
    content: heights.content,
    gap: viewport * CLOSING_GAP_SHARE,
    closing: heights.closing,
  })
  setTransform(content, `translateY(${contentY}px)`)
  setTransform(closing, `translateY(${closingY}px)`)
}

function setTransform(element: HTMLElement, transform: string) {
  if (element.style.transform !== transform) element.style.transform = transform
}

function applyLook(screen: HTMLElement | null) {
  if (!screen) return
  setProperty(screen, "--credits-background", creditsLook.background)
  setProperty(screen, "--credits-shadow", creditsTextShadow(creditsLook))
  setProperty(screen, "--credits-roll-shadow", rollTextShadow(creditsLook))
}

function setProperty(element: HTMLElement, name: string, value: string) {
  if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value)
}

function secondsNow() {
  return performance.now() / MILLISECONDS
}

function usePress(
  listening: boolean,
  axis: InputAxis,
  heldKeys: ReturnType<typeof useHeldKeys>,
  action: () => void,
) {
  useEffect(() => {
    if (!listening) return
    const isHeld = () => readAxis(axis, heldKeys.current, readGamepad()) > PRESSED
    let wasHeld = isHeld()
    let frame = 0
    const poll = () => {
      const held = isHeld()
      if (held && !wasHeld) action()
      wasHeld = held
      frame = window.requestAnimationFrame(poll)
    }
    frame = window.requestAnimationFrame(poll)
    return () => window.cancelAnimationFrame(frame)
  }, [listening, axis, heldKeys, action])
}

function useDeviceOf(element: RefObject<HTMLElement | null>, listening: boolean) {
  const readDevice = useLastInputDevice()
  useEffect(() => {
    if (!listening) return
    let frame = 0
    const poll = () => {
      const device = readDevice(readGamepad())
      const target = element.current
      if (target && target.dataset.device !== device) target.dataset.device = device
      frame = window.requestAnimationFrame(poll)
    }
    frame = window.requestAnimationFrame(poll)
    return () => window.cancelAnimationFrame(frame)
  }, [element, listening, readDevice])
}

function ignoreRefusedLock() {}
