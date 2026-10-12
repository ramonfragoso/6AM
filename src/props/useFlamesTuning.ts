import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import type { FlameGroup } from "./flames"

const STEP = 0.001

const DECIMALS = 3

const WHOLE = 1

export type FireSettings = {
  color: string
  magnitude: number
  lacunarity: number
  gain: number
  iterations: number
  octaves: number
  width: number
  height: number
}

export type FlameLightSettings = {
  intensity: number
  color: string
  distance: number
  decay: number
  flicker: number
}

export type FlameSettings = { fire: FireSettings; light: FlameLightSettings }

type GroupDefaults = {
  label: string
  width: number
  height: number
  light: number
  iterations?: number
  octaves?: number
  distance?: number
}

const DEFAULT_ITERATIONS = 25

const DEFAULT_OCTAVES = 4

const DEFAULT_LIGHT_DISTANCE = 9.778

export function useFlamesTuning(): Record<FlameGroup, FlameSettings> {
  const lanterns = useGroupControls({
    label: "Lanterns",
    width: 0.03,
    height: 0.07,
    light: 0.8,
  })
  const tiledLantern = useGroupControls({
    label: "Tiled Lantern",
    width: 0.03,
    height: 0.07,
    light: 0.8,
  })
  const candlestick = useGroupControls({
    label: "Candlestick",
    width: 0.02,
    height: 0.05,
    light: 3.028,
  })
  const candle = useGroupControls({
    label: "Candle",
    width: 0.02,
    height: 0.05,
    light: 3.028,
  })
  return useMemo(
    () => ({
      lanterns,
      tiledLantern,
      candlestick,
      candle,
    }),
    [lanterns, tiledLantern, candlestick, candle],
  )
}

export function useGroupControls({
  label,
  width,
  height,
  light,
  iterations = DEFAULT_ITERATIONS,
  octaves = DEFAULT_OCTAVES,
  distance = DEFAULT_LIGHT_DISTANCE,
}: GroupDefaults): FlameSettings {
  const values = useTuningControls(
    `Flames.${label}`,
    {
      fireColor: { value: "#ff6600", hint: "Tint of the fire" },
      magnitude: fineSlider(1.5, 0.5, 3, "How tall and wild the flame shapes get"),
      lacunarity: fineSlider(2.5, 1, 4, "Frequency step between noise octaves"),
      gain: fineSlider(0.7, 0.1, 1, "Strength kept by each finer noise octave"),
      iterations: slider(
        iterations,
        5,
        60,
        WHOLE,
        "Ray marching steps; changing it rebuilds the fire shaders",
      ),
      octaves: slider(octaves, 1, 8, WHOLE, "Noise octaves; changing it rebuilds the fire shaders"),
      width: fineSlider(width, 0.005, 0.2, "Fire width in meters"),
      height: fineSlider(height, 0.01, 0.4, "Fire height in meters"),
      light: fineSlider(light, 0, 30, "Intensity of the light each fire casts"),
      lightColor: { value: "#ff9826", hint: "Color of the light each fire casts" },
      distance: fineSlider(
        distance,
        0.5,
        15,
        "Meters until the light fades out; also its shadow range",
      ),
      decay: fineSlider(1.309, 0, 3, "How fast the light fades with distance (2 is physical)"),
      flicker: fineSlider(0.093, 0, 1, "How much the light wavers"),
    },
    { collapsed: true },
  )
  return useMemo(
    () => ({
      fire: {
        color: values.fireColor,
        magnitude: values.magnitude,
        lacunarity: values.lacunarity,
        gain: values.gain,
        iterations: values.iterations,
        octaves: values.octaves,
        width: values.width,
        height: values.height,
      },
      light: {
        intensity: values.light,
        color: values.lightColor,
        distance: values.distance,
        decay: values.decay,
        flicker: values.flicker,
      },
    }),
    [values],
  )
}

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}
