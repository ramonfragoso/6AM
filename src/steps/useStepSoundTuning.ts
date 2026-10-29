import { useMemo } from "react"
import { slider } from "@/debug/slider"
import {
  muffleSlider,
  pitchSlider,
  pitchVariationSlider,
  variationSliders,
  volumeSlider,
} from "@/sound/soundSliders"
import type { SoundVariation } from "@/sound/variedSound"
import { useTuningControls } from "@/tuning/useTuningControls"
import type { FloorKind } from "./floorUnderfoot"

export type StepSoundSettings = {
  step: SoundVariation
  floors: Record<FloorKind, number>
  creak: SoundVariation
  creakChance: number
  creakSpacing: number
}

const STEP_VARIATION = {
  volumeVariation: 0.15,
  muffleVariation: 0.08,
  lengthVariation: 0.2,
  timingVariation: 0.025,
}

const CREAK_VARIATION = {
  volumeVariation: 0.3,
  muffleVariation: 0.15,
  lengthVariation: 0.4,
  timingVariation: 0.2,
}

export function useStepSoundTuning() {
  const steps = useTuningControls(
    "Sound.Steps",
    {
      volume: volumeSlider(1, "Loudness of every Step"),
      wood: volumeSlider(1, "Loudness of Steps on the first Corridor's oak Floor"),
      tiles: volumeSlider(1, "Loudness of Steps on Floor Tiles (second Corridor, Safe Rooms)"),
      pitch: pitchSlider(0, "Pitch of every Step"),
      pitchVariation: pitchVariationSlider(
        0.8,
        "Random pitch change on every Step, so no two sound copied",
      ),
      muffle: muffleSlider(0.1, "Muffles every Step"),
      ...variationSliders(STEP_VARIATION, "Step"),
    },
    { collapsed: true },
  )
  const creaks = useTuningControls(
    "Sound.Steps.Creaks",
    {
      chance: slider(
        0.1,
        0,
        1,
        0.01,
        "Share of Steps on the oak Floor that also creak (0.1 is about one in ten); Floor Tiles never creak",
      ),
      spacing: slider(
        1,
        0,
        20,
        1,
        "Steps after a Creak before the next one may come, so they never bunch up; 0 lets them follow each other",
      ),
      volume: volumeSlider(0.8, "Loudness of every Creak"),
      pitch: pitchSlider(0, "Pitch of every Creak"),
      pitchVariation: pitchVariationSlider(1.5, "Random pitch change on every Creak"),
      muffle: muffleSlider(0.15, "Muffles every Creak"),
      ...variationSliders(CREAK_VARIATION, "Creak"),
    },
    { collapsed: true },
  )
  return useMemo<StepSoundSettings>(
    () => ({
      step: variationOf(steps),
      floors: { wood: steps.wood, tiles: steps.tiles },
      creak: variationOf(creaks),
      creakChance: creaks.chance,
      creakSpacing: creaks.spacing,
    }),
    [steps, creaks],
  )
}

function variationOf(values: SoundVariation): SoundVariation {
  return {
    volume: values.volume,
    volumeVariation: values.volumeVariation,
    pitch: values.pitch,
    pitchVariation: values.pitchVariation,
    muffle: values.muffle,
    muffleVariation: values.muffleVariation,
    lengthVariation: values.lengthVariation,
    timingVariation: values.timingVariation,
  }
}
