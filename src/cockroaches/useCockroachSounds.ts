import { useFrame } from "@react-three/fiber"
import { type RefObject, useEffect, useRef } from "react"
import { MathUtils } from "three"
import { nightClock } from "@/night/nightClock"
import { loopState } from "@/passage/loopState"
import { playerPose } from "@/player/playerPose"
import { audioEngine, bufferOf, preloadSounds } from "@/sound/audioEngine"
import {
  createEmitter,
  disposeEmitter,
  placeEmitter,
  setPresence,
  shapeEmitter,
  type SoundEmitter,
} from "@/sound/soundEmitter"
import type { SoundName } from "@/sound/sounds"
import { playVaried } from "@/sound/variedSound"
import type { Cockroach } from "./cockroachWalk"
import type { Swarm } from "./useCockroaches"
import { type CockroachSound, MAX_VOICES } from "./useCockroachTuning"

type Voice = {
  emitter: SoundEmitter
  roach: number
  nextPlayAt: number
  level: number
}

const SKITTER: SoundName = "crawlingBug"

const SKITTERING_SPEED = 0.02

const KEPT_SHARE = 2

const GAP_SPREAD = [0.7, 1.3] as const

const NOBODY = -1

const SILENT = 0

export function useCockroachSounds(swarm: RefObject<Swarm | null>, sound: CockroachSound) {
  const voices = useRef<Voice[] | null>(null)

  useEffect(() => preloadSounds([SKITTER]), [])

  useEffect(() => {
    voices.current?.forEach((voice) => shapeEmitter(voice.emitter, sound.shape))
  }, [sound.shape])

  useEffect(
    () => () => {
      voices.current?.forEach((voice) => disposeEmitter(voice.emitter))
      voices.current = null
    },
    [],
  )

  useFrame(() => {
    const engine = audioEngine()
    const buffer = bufferOf(SKITTER)
    if (!engine || !buffer) return
    voices.current ??= Array.from({ length: MAX_VOICES }, () => {
      const emitter = createEmitter(engine, "effects")
      shapeEmitter(emitter, sound.shape)
      return {
        emitter,
        roach: NOBODY,
        nextPlayAt: 0,
        level: SILENT,
      }
    })
    const now = nightClock()
    const playing = voices.current.slice(0, sound.voices)
    const current = swarm.current
    const nearest = current ? skitteringNearest(current, sound.shape.maxDistance) : []
    const gap = buffer.duration * (1 - sound.overlap)
    assignVoices(playing, nearest, sound.voices, now, gap)
    voices.current.forEach((voice, index) => {
      const roach = current && index < sound.voices ? current.roaches[voice.roach] : undefined
      if (!roach) voice.roach = NOBODY
      const level = roach ? loopState.houseLevel : SILENT
      if (level !== voice.level) {
        voice.level = level
        setPresence(voice.emitter, level, engine.context.currentTime)
      }
      if (!roach) return
      placeEmitter(voice.emitter, roach.position)
      if (now < voice.nextPlayAt) return
      playVaried(SKITTER, sound.variation, 1, voice.emitter)
      voice.nextPlayAt = now + gap * MathUtils.lerp(...GAP_SPREAD, Math.random())
    })
  })
}

function skitteringNearest({ roaches, count }: Swarm, maxDistance: number) {
  const { eye } = playerPose
  return roaches
    .slice(0, count)
    .map((roach, index) => ({ index, distance: roach.position.distanceTo(eye), roach }))
    .filter(({ roach, distance }) => skittering(roach) && distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .map(({ index }) => index)
}

function skittering(roach: Cockroach) {
  return roach.stage === "emerging" || (roach.stage !== "hidden" && roach.speed > SKITTERING_SPEED)
}

function assignVoices(
  voices: Voice[],
  nearest: number[],
  wanted: number,
  now: number,
  gap: number,
) {
  const kept = new Set(nearest.slice(0, wanted * KEPT_SHARE))
  for (const voice of voices) {
    if (!kept.has(voice.roach)) voice.roach = NOBODY
  }
  const taken = new Set(voices.map((voice) => voice.roach))
  const free = nearest.filter((index) => !taken.has(index))
  for (const voice of voices) {
    if (voice.roach !== NOBODY) continue
    const next = free.shift()
    if (next === undefined) return
    voice.roach = next
    voice.nextPlayAt = now + Math.random() * gap
  }
}
