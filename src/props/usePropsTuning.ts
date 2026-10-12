import { useMemo } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { COAT_RACK_SPOT } from "./coatRack"
import type { FurnitureSpot, TiledLanternSpot } from "./propPlacements"

const STEP = 0.001

const DECIMALS = 3

export function usePropsTuning(tiledLanternDefaults: TiledLanternSpot) {
  const squareTable = useFurnitureControls("Props.Square Table", {
    x: 0,
    z: -0.7,
    turn: 0,
    size: 1,
  })
  const roundTable = useFurnitureControls("Props.Round Table", {
    x: 9.45,
    z: 4.5,
    turn: 0,
    size: 1,
  })
  const chair = useFurnitureControls("Props.Chair", {
    x: 9.45,
    z: 5.3,
    turn: 0,
    size: 1,
  })
  const coatRack = useFurnitureControls("Props.Coat Rack", COAT_RACK_SPOT)
  const { height } = useTuningControls(
    "Props.Lanterns",
    {
      height: fineSlider(
        0,
        -1.5,
        1,
        "Meters above (or below) where the lanterns hang on the columns in Blender",
      ),
    },
    { collapsed: true },
  )
  const tiledLantern = useTiledLanternControls(tiledLanternDefaults)
  return {
    squareTable,
    roundTable,
    chair,
    coatRack,
    tiledLantern,
    lanternHeight: height,
  }
}

function useTiledLanternControls(spot: TiledLanternSpot) {
  const values = useTuningControls(
    "Props.Tiled Lantern",
    {
      x: fineSlider(spot.x, -12, 12, "World X in meters"),
      z: fineSlider(spot.z, -3, 18, "World Z in meters"),
      height: fineSlider(
        spot.height,
        -1.5,
        1,
        "Meters above (or below) the other lanterns, which Props Lanterns height already moves",
      ),
      turn: fineSlider(spot.turn, -180, 180, "Turn around the vertical axis, in degrees"),
      size: fineSlider(spot.size, 0.5, 1.5, "Scale of the lantern around its column"),
    },
    { collapsed: true },
  )
  return useMemo<TiledLanternSpot>(() => ({ ...values }), [values])
}

function useFurnitureControls(folder: string, spot: FurnitureSpot) {
  const values = useTuningControls(
    folder,
    {
      x: fineSlider(spot.x, -12, 12, "World X in meters"),
      z: fineSlider(spot.z, -3, 18, "World Z in meters"),
      turn: fineSlider(spot.turn, -180, 180, "Turn around the vertical axis, in degrees"),
      size: fineSlider(
        spot.size,
        0.5,
        1.5,
        "Scale of the whole piece; everything on it scales along, so nothing moves apart",
      ),
    },
    { collapsed: true },
  )
  return useMemo<FurnitureSpot>(() => ({ ...values }), [values])
}

function fineSlider(value: number, min: number, max: number, hint: string) {
  return { ...slider(value, min, max, STEP, hint), pad: DECIMALS }
}
