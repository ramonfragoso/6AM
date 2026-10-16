import { BUSES, type Bus, SOUNDS, type SoundName } from "./sounds"

export type AudioEngine = {
  context: AudioContext
  fader: GainNode
  master: GainNode
  buses: Record<Bus, GainNode>
}

export type Volumes = Record<"master" | Bus, number>

let engine: AudioEngine | null = null

const volumes: Volumes = {
  master: 1,
  effects: 1,
  ambience: 1,
  music: 1,
}

let fadedLevel = 1

const fetched = new Map<SoundName, Promise<ArrayBuffer | null>>()

const decoding = new Set<SoundName>()

const decoded = new Map<SoundName, AudioBuffer>()

export function audioEngine() {
  return engine?.context.state === "running" ? engine : null
}

export function unlockAudio() {
  if (!engine) engine = createEngine()
  if (engine.context.state === "suspended") void engine.context.resume()
  for (const name of fetched.keys()) decode(name)
}

export function setVolumes(next: Volumes) {
  Object.assign(volumes, next)
  if (engine) applyVolumes(engine)
}

export function fadeAllSound(level: number, seconds: number) {
  fadedLevel = level
  if (!engine) return
  const { context, fader } = engine
  const now = context.currentTime
  fader.gain.cancelScheduledValues(now)
  fader.gain.setValueAtTime(fader.gain.value, now)
  fader.gain.linearRampToValueAtTime(level, now + seconds)
}

export function preloadSounds(names: readonly SoundName[]) {
  for (const name of names) {
    if (!fetched.has(name)) fetched.set(name, fetchSound(name))
    decode(name)
  }
}

export function bufferOf(name: SoundName) {
  return decoded.get(name) ?? null
}

function createEngine(): AudioEngine {
  const context = new AudioContext({ latencyHint: "interactive" })
  const fader = context.createGain()
  fader.gain.value = fadedLevel
  fader.connect(context.destination)
  const master = context.createGain()
  master.connect(fader)
  const buses = Object.fromEntries(
    BUSES.map((bus) => {
      const gain = context.createGain()
      gain.connect(master)
      return [bus, gain]
    }),
  ) as Record<Bus, GainNode>
  const created = {
    context,
    fader,
    master,
    buses,
  }
  applyVolumes(created)
  return created
}

function applyVolumes({ master, buses }: AudioEngine) {
  master.gain.value = volumes.master
  for (const bus of BUSES) buses[bus].gain.value = volumes[bus]
}

async function fetchSound(name: SoundName) {
  try {
    const response = await fetch(SOUNDS[name].url)
    if (!response.ok) throw new Error(`${response.status}`)
    return await response.arrayBuffer()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Sound "${name}" (${SOUNDS[name].url}) did not load: ${error}`)
    return null
  }
}

function decode(name: SoundName) {
  const data = fetched.get(name)
  if (!engine || !data || decoding.has(name) || decoded.has(name)) return
  decoding.add(name)
  const { context } = engine
  void data
    .then((bytes) => (bytes ? context.decodeAudioData(bytes.slice(0)) : null))
    .then((buffer) => {
      if (buffer) decoded.set(name, buffer)
    })
    // eslint-disable-next-line no-console
    .catch((error) => console.warn(`Sound "${name}" did not decode: ${error}`))
}
