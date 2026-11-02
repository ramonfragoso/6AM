import { useEffect, useMemo } from "react"
import { slider } from "@/debug/slider"
import type { FurnitureSpot } from "@/props/propPlacements"
import { useTuningControls } from "@/tuning/useTuningControls"
import { CLOCK_SPOT, CLOCK_TABLE_SPOT } from "./clock"
import { clockDialGlow, clockHandSurface, DIAL_GLOW, HAND_LOOK } from "./clockSurface"
import { clockTime, setMinuteStart } from "./clockTime"
import { handMotionSettings } from "./handMotion"

const STEP = 0.001

const DECIMALS = 3

const ROOM_REACH = 1.9

const TABLETOP_REACH = 0.35

const MINUTE_START = { minute: 0, second: 0 }

type SpotRanges = {
  reach: number
  minSize: number
  maxSize: number
  hints: SpotHints
}

type SpotHints = { x: string; z: string; size: string }

export function useClockTuning() {
  const table = useSpotControls("Clock.Table", CLOCK_TABLE_SPOT, {
    reach: ROOM_REACH,
    minSize: 0.5,
    maxSize: 1.5,
    hints: {
      x: "Meters from the Start Room's center, across the room (it moves with the Wrap, so it is room space, not world space)",
      z: "Meters from the Start Room's center toward its door into the first Corridor",
      size: "Scale of the table with the clock on it",
    },
  })
  const clock = useSpotControls("Clock.On Table", CLOCK_SPOT, {
    reach: TABLETOP_REACH,
    minSize: 0.5,
    maxSize: 3,
    hints: {
      x: "Meters from the tabletop's center, across the table",
      z: "Meters from the tabletop's center, along the table's front",
      size: "Scale of the clock alone, standing on the tabletop",
    },
  })
  useTimeControls()
  useHandControls()
  useDialControls()
  return { table, clock }
}

function useSpotControls(
  folder: string,
  spot: FurnitureSpot,
  { reach, minSize, maxSize, hints }: SpotRanges,
) {
  const values = useTuningControls(
    folder,
    {
      x: fineSlider(spot.x, -reach, reach, hints.x),
      z: fineSlider(spot.z, -reach, reach, hints.z),
      turn: fineSlider(spot.turn, -180, 180, "Turn around the vertical axis, in degrees"),
      size: fineSlider(spot.size, minSize, maxSize, hints.size),
    },
    { collapsed: true },
  )
  return useMemo<FurnitureSpot>(() => ({ ...values }), [values])
}

function useTimeControls() {
  const { minute, second, rate } = useTuningControls(
    "Clock.Time",
    {
      minute: slider(
        MINUTE_START.minute,
        0,
        59,
        1,
        "Minute the clock is stuck in; it starts again here whenever the Hour is shown (the hour Hand always shows the Night's Hour)",
      ),
      second: slider(
        MINUTE_START.second,
        0,
        59,
        1,
        "Second the clock starts counting from whenever the Hour is shown",
      ),
      rate: slider(1, 0, 600, 0.1, "Clock seconds per real second; 1 is real time, 0 stops it"),
    },
    { collapsed: true },
  )

  useEffect(() => setMinuteStart({ minute, second }), [minute, second])
  useEffect(() => {
    clockTime.rate = rate
  }, [rate])
}

function useHandControls() {
  const {
    color,
    roughness,
    metalness,
    tickSeconds,
    overshoot,
    glitchSeconds,
    resetSeconds,
    hourSeconds,
  } = useTuningControls(
    "Clock.Hands",
    {
      color: {
        value: HAND_LOOK.color,
        hint: "Color of the three Hands, in place of their texture",
      },
      roughness: fineSlider(HAND_LOOK.roughness, 0, 1, "0 is a mirror shine, 1 fully matte"),
      metalness: fineSlider(HAND_LOOK.metalness, 0, 1, "0 is painted, 1 bare metal"),
      tickSeconds: fineSlider(
        handMotionSettings.tickSeconds,
        0,
        0.9,
        "Seconds a Hand takes to move one mark when it ticks (and the minute Hand's jump)",
      ),
      overshoot: fineSlider(
        handMotionSettings.overshoot,
        0,
        4,
        "How far a ticking Hand swings past its mark before settling back; 0 stops dead",
      ),
      glitchSeconds: fineSlider(
        handMotionSettings.glitchSeconds,
        0,
        0.3,
        "Seconds each Glitch step takes; longer than the gap between steps blurs them together",
      ),
      resetSeconds: fineSlider(
        handMotionSettings.resetSeconds,
        0,
        3,
        "Seconds the Hands take to sweep back to the stuck minute after the Glitch or a restart",
      ),
      hourSeconds: fineSlider(
        handMotionSettings.hourSeconds,
        0,
        6,
        "Seconds the hour Hand takes to tick to a new Hour, with the same overshoot as a tick",
      ),
    },
    { collapsed: true },
  )

  useEffect(() => {
    clockHandSurface.color.value.set(color)
    clockHandSurface.roughness.value = roughness
    clockHandSurface.metalness.value = metalness
  }, [color, roughness, metalness])
  useEffect(() => {
    Object.assign(handMotionSettings, {
      tickSeconds,
      overshoot,
      glitchSeconds,
      resetSeconds,
      hourSeconds,
    })
  }, [tickSeconds, overshoot, glitchSeconds, resetSeconds, hourSeconds])
}

function useDialControls() {
  const { color, glow, printed } = useTuningControls(
    "Clock.Dial",
    {
      color: { value: DIAL_GLOW.color, hint: "Color of the light the dial gives off" },
      glow: fineSlider(DIAL_GLOW.glow, 0, 5, "How bright the dial glows on its own; 0 is unlit"),
      printed: fineSlider(
        DIAL_GLOW.printed,
        0,
        1,
        "1 glows only through the dial's pale paper, so the numbers stay dark; 0 glows evenly",
      ),
    },
    { collapsed: true },
  )

  useEffect(() => {
    clockDialGlow.color.value.set(color)
    clockDialGlow.glow.value = glow
    clockDialGlow.printed.value = printed
  }, [color, glow, printed])
}

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}
