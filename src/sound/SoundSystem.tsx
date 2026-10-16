import { useAudioUnlock } from "./useAudioUnlock"
import { useSoundListener } from "./useSoundListener"
import { useSoundTuning } from "./useSoundTuning"

export function SoundSystem() {
  useAudioUnlock()
  useSoundListener()
  useSoundTuning()
  return null
}
