import { audioEngine, bufferOf } from "./audioEngine"
import type { SoundEmitter } from "./soundEmitter"
import { SOUNDS, type SoundName } from "./sounds"

export type PlayOptions = {
  from?: SoundEmitter | null
  volume?: number
  rate?: number
}

export function playSound(
  name: SoundName,
  { from = null, volume = 1, rate = 1 }: PlayOptions = {},
) {
  const engine = audioEngine()
  const buffer = bufferOf(name)
  if (!engine || !buffer) return
  const { context, buses } = engine
  const source = context.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = rate
  const gain = context.createGain()
  gain.gain.value = volume * SOUNDS[name].volume
  source.connect(gain).connect(from ? from.input : buses[SOUNDS[name].bus])
  source.onended = () => gain.disconnect()
  source.start()
}
