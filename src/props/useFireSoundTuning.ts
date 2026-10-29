import { useMemo } from "react"
import {
  emitterShapeOf,
  emitterSliders,
  muffleSlider,
  pitchSlider,
  pitchVariationSlider,
  volumeSlider,
} from "@/sound/soundSliders"
import type { EmitterShape } from "@/sound/soundEmitter"
import { useTuningControls } from "@/tuning/useTuningControls"
import type { FireSoundGroup } from "./flames"

export type FireSoundSettings = {
  volume: number
  pitch: number
  pitchVariation: number
  muffle: number
  groups: Record<FireSoundGroup, number>
  shape: EmitterShape
}

const FIRE_EMITTER = { refDistance: 1, rolloff: 1.5, maxDistance: 10 }

export function useFireSoundTuning() {
  const values = useTuningControls(
    "Sound.Fires",
    {
      volume: volumeSlider(1, "Loudness of every burning Fire's crackle"),
      pitch: pitchSlider(0, "Pitch of every Fire"),
      pitchVariation: pitchVariationSlider(
        1,
        "How differently each Fire is pitched, so they do not sound like copies of one",
      ),
      muffle: muffleSlider(0, "Muffles every Fire"),
      lanterns: volumeSlider(1, "Loudness of each first-Corridor Lantern"),
      tiledLantern: volumeSlider(1, "Loudness of the second Corridor's Lantern"),
      candlestick: volumeSlider(1, "Loudness of the candlestick on the square Table Set"),
      candle: volumeSlider(1, "Loudness of the candle on the round Table Set"),
      candleSets: volumeSlider(1.5, "Loudness of the four Candle Sets together (one sound)"),
      ...emitterSliders(FIRE_EMITTER),
    },
    { collapsed: true },
  )
  return useMemo<FireSoundSettings>(
    () => ({
      volume: values.volume,
      pitch: values.pitch,
      pitchVariation: values.pitchVariation,
      muffle: values.muffle,
      groups: {
        lanterns: values.lanterns,
        tiledLantern: values.tiledLantern,
        candlestick: values.candlestick,
        candle: values.candle,
        candleSets: values.candleSets,
      },
      shape: emitterShapeOf(values),
    }),
    [values],
  )
}
