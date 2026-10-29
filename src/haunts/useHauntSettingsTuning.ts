import { useEffect } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import {
  clutterSettings,
  growingPaintingsSettings,
  lightsOutSettings,
  MAX_CLUTTER,
} from "./hauntSettings"

const STEP = 0.01

const SEMITONE_STEP = 0.1

export function useHauntSettingsTuning() {
  const lightsOut = useTuningControls(
    "Haunts.Lights Out",
    {
      color: {
        value: lightsOutSettings.color,
        hint: "Color every House light (and the ambient light) turns to",
      },
      minLight: slider(
        lightsOutSettings.minLight,
        0,
        1,
        STEP,
        "Share of their brightness the lights keep: enough to find the way back",
      ),
      fadeSeconds: slider(
        lightsOutSettings.fadeSeconds,
        0,
        10,
        STEP,
        "Seconds the lights take to dim and redden, while the ambience pitches down",
      ),
      pitch: slider(
        lightsOutSettings.pitch,
        -24,
        0,
        SEMITONE_STEP,
        "Semitones both ambience tracks drop while the lights dim",
      ),
      soundSeconds: slider(
        lightsOutSettings.soundSeconds,
        0,
        10,
        STEP,
        "Seconds the ambience then takes to fade to the volumes below",
      ),
      firstVolume: slider(
        lightsOutSettings.firstVolume,
        0,
        1,
        STEP,
        "Share of its volume the first ambience track keeps",
      ),
      secondVolume: slider(
        lightsOutSettings.secondVolume,
        0,
        1,
        STEP,
        "Share of its volume the second ambience track keeps",
      ),
    },
    { collapsed: true },
  )
  const growing = useTuningControls(
    "Haunts.Growing Paintings",
    {
      maxGrowth: slider(
        growingPaintingsSettings.maxGrowth,
        1,
        2,
        STEP,
        "Size the paintings stop growing at (1 is their own size); they grow along the wall, never out of it",
      ),
      seconds: slider(
        growingPaintingsSettings.seconds,
        5,
        300,
        1,
        "Seconds from the start of the Loop until they reach it",
      ),
    },
    { collapsed: true },
  )
  const clutter = useTuningControls(
    "Haunts.Many Books and Bottles",
    {
      count: slider(
        clutterSettings.count,
        0,
        MAX_CLUTTER,
        1,
        "Books and bottles scattered from the Corner to the Door Wall",
      ),
      onLedges: slider(
        clutterSettings.onLedges,
        0,
        1,
        STEP,
        "Share of the bottles that stand on the wall ledges instead of the Floor",
      ),
    },
    { collapsed: true },
  )

  useEffect(() => void Object.assign(lightsOutSettings, lightsOut), [lightsOut])
  useEffect(() => void Object.assign(growingPaintingsSettings, growing), [growing])
  useEffect(() => void Object.assign(clutterSettings, clutter), [clutter])
}
