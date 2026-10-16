import { useEffect, useMemo } from "react"
import { slider } from "@/debug/slider"
import type { FurnitureSpot } from "@/props/propPlacements"
import { useTuningControls } from "@/tuning/useTuningControls"
import { CLOCK_SPOT, CLOCK_TABLE_SPOT } from "./clock"
import { clockTime, setMinuteStart } from "./clockTime"

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

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}
