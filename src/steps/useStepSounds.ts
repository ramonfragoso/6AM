import { useEffect, useRef } from "react"
import { playerPose } from "@/player/playerPose"
import { preloadSounds } from "@/sound/audioEngine"
import type { SoundName } from "@/sound/sounds"
import { playVaried } from "@/sound/variedSound"
import { type FloorKind, floorUnderfoot } from "./floorUnderfoot"
import { stepEvents } from "./stepEvents"
import { type StepSoundSettings, useStepSoundTuning } from "./useStepSoundTuning"

const STEP_SOUNDS: Record<FloorKind, SoundName> = { wood: "woodStep", tiles: "tileStep" }

const CREAK_SOUNDS: SoundName[] = ["woodCreak", "woodCreak2", "woodCreak3"]

const CREAKING_FLOORS: ReadonlySet<FloorKind> = new Set(["wood"])

type CreakHistory = { stepsSince: number; last: SoundName | null }

export function useStepSounds() {
  const settings = useStepSoundTuning()
  const creaks = useRef<CreakHistory>({ stepsSince: Infinity, last: null })

  useEffect(() => preloadSounds([...Object.values(STEP_SOUNDS), ...CREAK_SOUNDS]), [])

  useEffect(
    () =>
      stepEvents.listen(() => {
        const floor = floorUnderfoot(playerPose.eye)
        playVaried(STEP_SOUNDS[floor], settings.step, settings.floors[floor])
        creaks.current.stepsSince += 1
        if (CREAKING_FLOORS.has(floor)) maybeCreak(creaks.current, settings)
      }),
    [settings],
  )
}

function maybeCreak(history: CreakHistory, settings: StepSoundSettings) {
  if (history.stepsSince <= settings.creakSpacing) return
  if (Math.random() >= settings.creakChance) return
  const creak = differentFrom(history.last)
  playVaried(creak, settings.creak)
  history.stepsSince = 0
  history.last = creak
}

function differentFrom(last: SoundName | null) {
  const choices = CREAK_SOUNDS.filter((sound) => sound !== last)
  return choices[Math.floor(Math.random() * choices.length)]
}
