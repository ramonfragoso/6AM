import type { AudioEngine } from "./audioEngine"
import { createTone, rateOf } from "./shaping"
import { SOUNDS, type SoundName } from "./sounds"

export type LoopSettings = { volume: number; pitch: number; tone: number }

export type SoundLoop = {
  name: SoundName
  source: AudioBufferSourceNode
  tone: BiquadFilterNode
  gain: GainNode
}

const FADE_IN_SECONDS = 2

const TUNING_SMOOTHING = 0.05

export function startLoop(
  { context }: AudioEngine,
  name: SoundName,
  buffer: AudioBuffer,
  output: AudioNode,
  settings: LoopSettings,
  offset: number,
  fadeInSeconds = FADE_IN_SECONDS,
): SoundLoop {
  const source = new AudioBufferSourceNode(context, {
    buffer,
    loop: true,
    playbackRate: rateOf(settings.pitch),
  })
  const tone = createTone(context, settings.tone)
  const gain = new GainNode(context, { gain: 0 })
  source.connect(tone).connect(gain).connect(output)
  const now = context.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(levelOf(name, settings), now + fadeInSeconds)
  source.start(now, offset * buffer.duration)
  return {
    name,
    source,
    tone,
    gain,
  }
}

export function tuneLoop({ name, source, tone, gain }: SoundLoop, settings: LoopSettings) {
  const now = source.context.currentTime
  gain.gain.cancelScheduledValues(now)
  gain.gain.setTargetAtTime(levelOf(name, settings), now, TUNING_SMOOTHING)
  tone.frequency.setTargetAtTime(settings.tone, now, TUNING_SMOOTHING)
  source.playbackRate.setTargetAtTime(rateOf(settings.pitch), now, TUNING_SMOOTHING)
}

export function fadeOutLoop({ source, tone, gain }: SoundLoop, seconds: number) {
  const now = source.context.currentTime
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.linearRampToValueAtTime(0, now + seconds)
  source.onended = () => {
    tone.disconnect()
    gain.disconnect()
  }
  source.stop(now + seconds)
}

export function stopLoop({ source, tone, gain }: SoundLoop) {
  source.stop()
  source.disconnect()
  tone.disconnect()
  gain.disconnect()
}

function levelOf(name: SoundName, { volume }: LoopSettings) {
  return volume * SOUNDS[name].volume
}
