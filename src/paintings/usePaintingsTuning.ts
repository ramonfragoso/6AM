import { useMemo } from "react"
import type { Vector3Tuple } from "three"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import type { HouseArrangements } from "./hangPaintings"

const STEP = 0.001

const DECIMALS = 3

const NO_ROTATION: Vector3Tuple = [0, 0, 0]

const SINGLE_PAINTING_GAP = 0

export type GlassSettings = { glassReflection: number; glassRoughness: number }

export function usePaintingsTuning() {
  const { glassReflection, glassRoughness } = useTuningControls(
    "Paintings",
    {
      glassReflection: fineSlider(
        0.3,
        0,
        1,
        "How much light the glass over each painting reflects",
      ),
      glassRoughness: fineSlider(
        0.15,
        0.02,
        0.6,
        "Blur of the glass reflections: higher is a softer sheen",
      ),
    },
    { collapsed: true },
  )
  const end = useTuningControls(
    "Paintings.End Wall",
    {
      ...groupControls(1.85),
      portrait: rotationControl("The portrait (Papa, or the Scary Pope Haunt)"),
    },
    { collapsed: true },
  )
  const left = useTuningControls(
    "Paintings.Left Wall",
    {
      ...groupControls(1.8),
      gap: fineSlider(0.15, 0, 1, "Meters between the two frames"),
      top: rotationControl("The upper painting (A Pilgrimage to San Isidro)"),
      bottom: rotationControl("The lower painting (Witches' Sabbath)"),
    },
    { collapsed: true },
  )
  const right = useTuningControls(
    "Paintings.Right Wall",
    {
      ...groupControls(1.75),
      gap: fineSlider(0.25, 0, 1, "Meters between neighboring frames"),
      left: rotationControl("The left painting (Two Monks)"),
      middle: rotationControl("The middle painting (Two Women Eating)"),
      right: rotationControl("The right painting (Reading)"),
    },
    { collapsed: true },
  )

  const glass = useMemo<GlassSettings>(
    () => ({ glassReflection, glassRoughness }),
    [glassReflection, glassRoughness],
  )
  const arrangements = useMemo<HouseArrangements>(
    () => ({
      endWall: { ...end, gap: SINGLE_PAINTING_GAP, rotations: [end.portrait] },
      leftWall: { ...left, rotations: [left.top, left.bottom] },
      rightWall: { ...right, rotations: [right.left, right.middle, right.right] },
    }),
    [end, left, right],
  )
  return { glass, arrangements }
}

function groupControls(height: number) {
  return {
    along: fineSlider(
      0,
      -3,
      3,
      "Meters along the wall from its middle; positive moves it right as you face it",
    ),
    height: fineSlider(height, 0.5, 2.8, "Height of the center above the Floor, in meters"),
    size: fineSlider(1, 0.25, 2, "Scale of the frames and paintings"),
    depth: fineSlider(0, 0, 0.3, "Meters between the wall and the back of the frames"),
  }
}

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}

function rotationControl(painting: string) {
  return {
    value: NO_ROTATION,
    step: STEP,
    pad: DECIMALS,
    hint: `${painting}, in degrees: x leans it off the wall, y turns it sideways, z tilts it`,
  }
}
