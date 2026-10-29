import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { type AudioEngine, audioEngine, bufferOf, preloadSounds } from "./audioEngine"
import { type LoopSettings, type SoundLoop, startLoop, stopLoop, tuneLoop } from "./soundLoop"
import type { SoundName } from "./sounds"

export type LoopOutput = (engine: AudioEngine) => AudioNode | null

export type LoopShaping = (settings: LoopSettings) => LoopSettings

export function useSoundLoop(
  name: SoundName,
  output: LoopOutput,
  settings: LoopSettings,
  offset = 0,
  shaping: LoopShaping = unshaped,
) {
  const loop = useRef<SoundLoop | null>(null)
  const playing = useRef<LoopSettings | null>(null)

  useEffect(() => preloadSounds([name]), [name])

  useEffect(
    () => () => {
      if (loop.current) stopLoop(loop.current)
      loop.current = null
    },
    [],
  )

  useFrame(() => {
    const shaped = shaping(settings)
    if (loop.current) {
      if (playing.current && sameSettings(playing.current, shaped)) return
      tuneLoop(loop.current, shaped)
      playing.current = shaped
      return
    }
    const engine = audioEngine()
    const buffer = bufferOf(name)
    const destination = engine && output(engine)
    if (!engine || !buffer || !destination) return
    loop.current = startLoop(engine, name, buffer, destination, shaped, offset)
    playing.current = shaped
  })
}

function unshaped(settings: LoopSettings) {
  return settings
}

function sameSettings(before: LoopSettings, now: LoopSettings) {
  return before.volume === now.volume && before.pitch === now.pitch && before.tone === now.tone
}
