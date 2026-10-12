import { useEffect, useMemo } from "react"
import { slider } from "@/debug/slider"
import { candleWax } from "@/kit/kitSurface"
import type { FurnitureSpot } from "@/props/propPlacements"
import { useGroupControls } from "@/props/useFlamesTuning"
import { useTuningControls } from "@/tuning/useTuningControls"
import type { CandleSetLight, CandleSetSpot, CandleSetSpots } from "./candleSets"

const STEP = 0.001

const DECIMALS = 3

const COLLAPSED = { collapsed: true }

const FIRE_DEFAULTS = {
  label: "Candle Sets",
  width: 0.012,
  height: 0.03,
  light: 8,
  iterations: 8,
  octaves: 2,
  distance: 6,
}

const SECOND_CORRIDOR_CENTER_X = 9

const DOOR_Z = 17.0985

const DOOR_CLEARANCE = 0.3

const SETS_END_Z = DOOR_Z - DOOR_CLEARANCE

const FACING_SECOND_CORRIDOR = 90

const NARROWER_PER_SIDE = 0.15

const SET_MIDDLE_ALONG = 0.83

const LEFT = 1

const RIGHT = -1

type Side = typeof LEFT | typeof RIGHT

type LightLayout = { across: number; height: number }

export function useCandleSetsTuning() {
  const topLeft = useSetControls(
    "Top Left",
    secondCorridorSpot(LEFT),
    setLight(LEFT, { across: 1, height: 1.55 }),
  )
  const topRight = useSetControls(
    "Top Right",
    secondCorridorSpot(RIGHT),
    setLight(RIGHT, { across: 1, height: 1.3 }),
  )
  const bottomLeft = useSetControls(
    "Bottom Left",
    secondCorridorSpot(LEFT),
    setLight(LEFT, { across: 0.7, height: 0.45 }),
  )
  const bottomRight = useSetControls(
    "Bottom Right",
    secondCorridorSpot(RIGHT),
    setLight(RIGHT, { across: 0.7, height: 0.35 }),
  )
  useWaxControls()
  const flame = useGroupControls(FIRE_DEFAULTS)
  const spots = useMemo<CandleSetSpots>(
    () => ({
      candle_set_top_left: topLeft,
      candle_set_top_right: topRight,
      candle_set_bottom_left: bottomLeft,
      candle_set_bottom_right: bottomRight,
    }),
    [topLeft, topRight, bottomLeft, bottomRight],
  )
  return { spots, flame }
}

function secondCorridorSpot(side: Side): FurnitureSpot {
  return {
    x: SECOND_CORRIDOR_CENTER_X - side * NARROWER_PER_SIDE,
    z: SETS_END_Z,
    turn: FACING_SECOND_CORRIDOR,
    size: 1,
  }
}

function setLight(side: Side, { across, height }: LightLayout): CandleSetLight {
  return {
    lightHeight: height,
    light1X: secondCorridorSpot(side).x + side * across,
    light1Z: SETS_END_Z - SET_MIDDLE_ALONG,
  }
}

function useSetControls(label: string, spot: FurnitureSpot, light: CandleSetLight) {
  const values = useTuningControls(
    `Candle Sets.${label}`,
    {
      ...placementControls(spot),
      lightHeight: fineSlider(light.lightHeight, 0, 3, "World Y of the light in meters"),
      light1X: fineSlider(light.light1X, -12, 12, "World X of the light"),
      light1Z: fineSlider(
        light.light1Z,
        -3,
        18,
        "World Z of the light (only the bottom sets' lights cast shadows)",
      ),
    },
    COLLAPSED,
  )
  return useMemo<CandleSetSpot>(() => {
    const { lightHeight, light1X, light1Z, ...placed } = values
    return { ...placed, light: { lightHeight, light1X, light1Z } }
  }, [values])
}

function placementControls(spot: FurnitureSpot) {
  return {
    x: fineSlider(spot.x, -12, 12, "World X in meters"),
    z: fineSlider(spot.z, -3, 18, "World Z in meters"),
    turn: fineSlider(spot.turn, -180, 180, "Turn around the vertical axis, in degrees"),
    size: fineSlider(spot.size, 0.5, 1.5, "Scale of the whole set, candles and fires along"),
  }
}

function useWaxControls() {
  const { roughness, metalness } = useTuningControls(
    "Candle Sets.Wax",
    {
      roughness: fineSlider(0.5, 0, 1, "How rough the wax looks: low is shiny"),
      metalness: fineSlider(0, 0, 1, "How metallic the wax looks"),
    },
    COLLAPSED,
  )

  useEffect(() => {
    candleWax.roughness.value = roughness
    candleWax.metalness.value = metalness
  }, [roughness, metalness])
}

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}
