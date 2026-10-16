import type { Vector3 } from "three"
import type { AudioEngine } from "./audioEngine"
import type { Bus } from "./sounds"

export type EmitterShape = {
  refDistance: number
  rolloff: number
  maxDistance: number
}

export type SoundEmitter = { input: GainNode; panner: PannerNode; presence: GainNode }

const PRESENCE_SMOOTHING = 0.05

export function createEmitter({ context, buses }: AudioEngine, bus: Bus): SoundEmitter {
  const input = context.createGain()
  const panner = new PannerNode(context, {
    panningModel: "HRTF",
    distanceModel: "inverse",
  })
  const presence = context.createGain()
  input.connect(panner).connect(presence).connect(buses[bus])
  return { input, panner, presence }
}

export function shapeEmitter({ panner }: SoundEmitter, shape: EmitterShape) {
  panner.refDistance = shape.refDistance
  panner.rolloffFactor = shape.rolloff
  panner.maxDistance = shape.maxDistance
}

export function placeEmitter({ panner }: SoundEmitter, at: Vector3) {
  panner.positionX.value = at.x
  panner.positionY.value = at.y
  panner.positionZ.value = at.z
}

export function setPresence({ presence }: SoundEmitter, level: number, now: number) {
  presence.gain.setTargetAtTime(level, now, PRESENCE_SMOOTHING)
}

export function disposeEmitter({ input, panner, presence }: SoundEmitter) {
  input.disconnect()
  panner.disconnect()
  presence.disconnect()
}
