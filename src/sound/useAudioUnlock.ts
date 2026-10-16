import { useEffect } from "react"
import { audioEngine, unlockAudio } from "./audioEngine"

const GESTURES = ["pointerdown", "keydown", "touchstart"] as const

export function useAudioUnlock() {
  useEffect(() => {
    const unlock = () => {
      unlockAudio()
      if (audioEngine()) stopListening()
    }
    const stopListening = () => {
      for (const gesture of GESTURES) window.removeEventListener(gesture, unlock)
    }
    for (const gesture of GESTURES) window.addEventListener(gesture, unlock)
    return stopListening
  }, [])
}
