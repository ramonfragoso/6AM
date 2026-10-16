import { useFrame } from "@react-three/fiber"
import { type RefObject, useEffect, useRef } from "react"
import { type Object3D, Vector3 } from "three"
import { audioEngine } from "./audioEngine"
import {
  createEmitter,
  disposeEmitter,
  type EmitterShape,
  placeEmitter,
  setPresence,
  shapeEmitter,
  type SoundEmitter,
} from "./soundEmitter"
import type { Bus } from "./sounds"

type Heard = { at: Vector3; presence: number }

export type EmitterOptions = {
  bus: Bus
  shape: EmitterShape
  presence: () => number
}

export function useSoundEmitter(
  object: RefObject<Object3D | null>,
  { bus, shape, presence }: EmitterOptions,
) {
  const emitter = useRef<SoundEmitter | null>(null)
  const heard = useRef<Heard>({ at: new Vector3(Number.NaN), presence: Number.NaN })
  const at = useRef(new Vector3())

  useEffect(() => {
    if (emitter.current) shapeEmitter(emitter.current, shape)
  }, [shape])

  useEffect(
    () => () => {
      if (emitter.current) disposeEmitter(emitter.current)
      emitter.current = null
    },
    [],
  )

  useFrame(() => {
    const engine = audioEngine()
    if (!engine || !object.current) return
    if (!emitter.current) {
      emitter.current = createEmitter(engine, bus)
      shapeEmitter(emitter.current, shape)
    }
    object.current.getWorldPosition(at.current)
    if (!at.current.equals(heard.current.at)) {
      heard.current.at.copy(at.current)
      placeEmitter(emitter.current, at.current)
    }
    const level = presence()
    if (level !== heard.current.presence) {
      heard.current.presence = level
      setPresence(emitter.current, level, engine.context.currentTime)
    }
  })

  return emitter
}
