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
  fadeIn?: number
}

export type PlayingSound = { stop: () => void }

const TAIL_FADE = 0.03

const WHOLE = 1

export function playSound(name: SoundName, options: PlayOptions = {}) {
  return startSound(name, options) !== null
}

export function startSound(
  name: SoundName,
  {
    from = null,
    volume = 1,
    pitch = 0,
    tone = OPEN_TONE,
    delay = 0,
    playedShare = WHOLE,
    fadeIn = 0,
  }: PlayOptions = {},
): PlayingSound | null {
  const engine = audioEngine()
  const buffer = bufferOf(name)
  if (!engine || !buffer) return null
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
  if (fadeIn > 0) {
    gain.gain.setValueAtTime(0, startAt)
    gain.gain.linearRampToValueAtTime(level, startAt + fadeIn)
  }
  source.start(startAt, skipped)
  if (playedShare < WHOLE) {
    const end = startAt + (buffer.duration * playedShare - skipped) / playbackRate
    gain.gain.setValueAtTime(level, Math.max(startAt, end - TAIL_FADE))
    gain.gain.linearRampToValueAtTime(0, end)
    source.stop(end)
  }
  return { stop: () => fadeOutNow(context, source, gain) }
}

function fadeOutNow(context: AudioContext, source: AudioBufferSourceNode, gain: GainNode) {
  const now = context.currentTime
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.linearRampToValueAtTime(0, now + TAIL_FADE)
  source.stop(now + TAIL_FADE)
}
