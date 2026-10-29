import { MathUtils } from "three"
import { type AudioEngine, audioEngine } from "./audioEngine"
import { createTone, OPEN_TONE } from "./shaping"
import { SOUNDS, type SoundName } from "./sounds"

export type StretchedPlay = {
  seconds: number
  volume: number
  tone: number
  keepPitch: boolean
}

type Route = { tone: BiquadFilterNode; gain: GainNode }

const MIN_RATE = 0.0625

const MAX_RATE = 16

const elements = new Map<SoundName, HTMLAudioElement>()

const routes = new Map<SoundName, Route>()

export function preloadStretchedSound(name: SoundName) {
  if (elements.has(name)) return
  const element = new Audio(SOUNDS[name].url)
  element.preload = "auto"
  elements.set(name, element)
}

export function playStretched(
  name: SoundName,
  { seconds, volume, tone, keepPitch }: StretchedPlay,
) {
  const engine = audioEngine()
  const element = elements.get(name)
  if (!engine || !element || !Number.isFinite(element.duration)) return
  const route = routeOf(engine, name, element)
  const now = engine.context.currentTime
  route.gain.gain.setValueAtTime(volume * SOUNDS[name].volume, now)
  route.tone.frequency.setValueAtTime(tone, now)
  element.preservesPitch = keepPitch
  element.playbackRate = MathUtils.clamp(element.duration / seconds, MIN_RATE, MAX_RATE)
  element.currentTime = 0
  element
    .play()
    // eslint-disable-next-line no-console
    .catch((error) => console.warn(`Sound "${name}" did not play: ${error}`))
}

function routeOf({ context, buses }: AudioEngine, name: SoundName, element: HTMLAudioElement) {
  const existing = routes.get(name)
  if (existing) return existing
  const tone = createTone(context, OPEN_TONE)
  const gain = new GainNode(context)
  context
    .createMediaElementSource(element)
    .connect(tone)
    .connect(gain)
    .connect(buses[SOUNDS[name].bus])
  const route = { tone, gain }
  routes.set(name, route)
  return route
}
