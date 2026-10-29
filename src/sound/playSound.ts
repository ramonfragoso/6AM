import { audioEngine, bufferOf } from "./audioEngine"
import { createTone, OPEN_TONE, rateOf } from "./shaping"
import type { SoundEmitter } from "./soundEmitter"
import { SOUNDS, type SoundName } from "./sounds"

export type PlayOptions = {
  from?: SoundEmitter | null
  volume?: number
  pitch?: number
  tone?: number
  delay?: number
  playedShare?: number
}

const TAIL_FADE = 0.03

const WHOLE = 1

export function playSound(
  name: SoundName,
  {
    from = null,
    volume = 1,
    pitch = 0,
    tone = OPEN_TONE,
    delay = 0,
    playedShare = WHOLE,
  }: PlayOptions = {},
) {
  const engine = audioEngine()
  const buffer = bufferOf(name)
  if (!engine || !buffer) return false
  const { context, buses } = engine
  const playbackRate = rateOf(pitch)
  const source = new AudioBufferSourceNode(context, { buffer, playbackRate })
  const filter = createTone(context, tone)
  const level = volume * SOUNDS[name].volume
  const gain = new GainNode(context, { gain: level })
  source
    .connect(filter)
    .connect(gain)
    .connect(from ? from.input : buses[SOUNDS[name].bus])
  source.onended = () => {
    filter.disconnect()
    gain.disconnect()
  }
  const startAt = context.currentTime + Math.max(delay, 0)
  const skipped = Math.max(-delay, 0) * playbackRate
  source.start(startAt, skipped)
  if (playedShare < WHOLE) {
    const end = startAt + (buffer.duration * playedShare - skipped) / playbackRate
    gain.gain.setValueAtTime(level, Math.max(startAt, end - TAIL_FADE))
    gain.gain.linearRampToValueAtTime(0, end)
    source.stop(end)
  }
  return true
}
