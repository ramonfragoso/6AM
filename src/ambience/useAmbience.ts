import { hauntState } from "@/haunts/hauntState"
import type { AudioEngine } from "@/sound/audioEngine"
import type { LoopSettings } from "@/sound/soundLoop"
import { useSoundLoop } from "@/sound/useSoundLoop"
import { useAmbienceTuning } from "./useAmbienceTuning"

const FROM_THE_START = 0

export function useAmbience() {
  const { first, second } = useAmbienceTuning()
  useSoundLoop("ambientLoop", ambienceBus, first, FROM_THE_START, hauntedFirst)
  useSoundLoop("ambientLoop2", ambienceBus, second, FROM_THE_START, hauntedSecond)
}

function ambienceBus({ buses }: AudioEngine) {
  return buses.ambience
}

function hauntedFirst(settings: LoopSettings) {
  return haunted(settings, hauntState.firstAmbience)
}

function hauntedSecond(settings: LoopSettings) {
  return haunted(settings, hauntState.secondAmbience)
}

function haunted({ volume, pitch, tone }: LoopSettings, share: number): LoopSettings {
  return { volume: volume * share, pitch: pitch + hauntState.ambiencePitch, tone }
}
