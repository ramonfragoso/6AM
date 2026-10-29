import { useFrame } from "@react-three/fiber"
import { type RefObject, useEffect, useRef } from "react"
import type { Object3D } from "three"
import { inHouse, MILLISECONDS } from "@/doorWall/leafSound"
import { hauntState } from "@/haunts/hauntState"
import { nightClock } from "@/night/nightClock"
import { loopState } from "@/passage/loopState"
import { refreshStaticShadows } from "@/props/FlameLights"
import { bufferOf, preloadSounds } from "@/sound/audioEngine"
import { playSound } from "@/sound/playSound"
import { semitonesOf } from "@/sound/shaping"
import type { SoundEmitter } from "@/sound/soundEmitter"
import { toneOf } from "@/sound/soundSliders"
import { useSoundEmitter } from "@/sound/useSoundEmitter"
import { FURNISH_PRIORITY } from "@/world/physicsSettings"
import type { CreakSound } from "./useVoidTuning"
import { openedShare, type VoidDoor, voidLeafAngle } from "./voidDoor"
import { VOID_DOORWAY } from "./voidOpen"
import { CREAKS, voidSettings } from "./voidSettings"

type Shading = { door: VoidDoor | null; at: number; done: boolean }

const NEVER = Number.NEGATIVE_INFINITY

const SHUT = 0

export function useVoidDoor(creakSpot: RefObject<Object3D | null>, sound: CreakSound) {
  const emitter = useSoundEmitter(creakSpot, {
    bus: "effects",
    shape: sound.shape,
    presence: inHouse,
  })
  const creaked = useRef<VoidDoor | null>(null)
  const shading = useRef<Shading>({ door: null, at: NEVER, done: false })
  const swung = useRef(false)

  useEffect(() => preloadSounds(CREAKS), [])

  useFrame(() => {
    const door = hauntState.voidDoor
    if (!door) {
      if (swung.current) shutVoidDoor()
      swung.current = false
      return
    }
    swung.current = true
    const seconds = nightClock() - door.openedAt
    loopState.leafAngles[VOID_DOORWAY] = voidLeafAngle(seconds, voidSettings)
    if (creaked.current !== door) {
      const tooLate = seconds > voidSettings.delay + voidSettings.openSeconds
      if (tooLate || playCreak(emitter.current, sound, seconds)) creaked.current = door
    }
    shadeWhileOpening(shading.current, door, seconds)
  }, FURNISH_PRIORITY)
}

function shutVoidDoor() {
  loopState.leafAngles[VOID_DOORWAY] = SHUT
  refreshStaticShadows()
}

function playCreak(emitter: SoundEmitter | null, sound: CreakSound, seconds: number) {
  const buffer = bufferOf(sound.creak)
  if (!emitter || !buffer) return false
  const fittedPitch = semitonesOf(buffer.duration / voidSettings.openSeconds)
  return playSound(sound.creak, {
    from: emitter,
    volume: sound.volume,
    pitch: sound.fitToDoor ? fittedPitch : sound.pitch,
    tone: toneOf(sound.muffle),
    delay: voidSettings.delay + sound.offset / MILLISECONDS - seconds,
  })
}

function shadeWhileOpening(shading: Shading, door: VoidDoor, seconds: number) {
  if (shading.door !== door) Object.assign(shading, { door, at: NEVER, done: false })
  const opened = openedShare(seconds, voidSettings)
  if (opened <= 0 || shading.done) return
  const { shadowUpdates } = voidSettings
  const due = shadowUpdates > 0 && seconds - shading.at >= 1 / shadowUpdates
  if (opened < 1 && !due) return
  refreshStaticShadows()
  shading.at = seconds
  shading.done = opened >= 1
}
