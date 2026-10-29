import { useFrame } from "@react-three/fiber"
import { type RefObject, useEffect, useMemo, useRef } from "react"
import { type AnimationClip, AnimationMixer, type Object3D } from "three"
import { inSecondCorridor } from "@/haunts/triggers"
import { hauntState } from "@/haunts/hauntState"
import { FIRST_CORRIDOR } from "@/kit/house"
import { nightClock } from "@/night/nightClock"
import { loopState } from "@/passage/loopState"
import { playerPose } from "@/player/playerPose"
import { placedCoatRack } from "@/props/coatRack"
import { audioEngine, bufferOf, preloadSounds } from "@/sound/audioEngine"
import { playSound } from "@/sound/playSound"
import type { SoundEmitter } from "@/sound/soundEmitter"
import { fadeOutLoop, type SoundLoop, startLoop, tuneLoop } from "@/sound/soundLoop"
import type { SoundName } from "@/sound/sounds"
import { useSoundEmitter } from "@/sound/useSoundEmitter"
import {
  flatDistance,
  type GhostAttack,
  ghostHome,
  type GhostSpot,
  IDLE_CLIP,
  looksAtGhost,
  WALK_CLIP,
  walkToward,
} from "./ghost"
import { ghostLook } from "./ghostLook"
import { type GhostSettings, type GhostSound, useGhostTuning } from "./useGhostTuning"

type Stage = "waiting" | "chasing" | "vanishing" | "gone"

type Chase = {
  attack: GhostAttack
  stage: Stage
  sighted: boolean
  spot: GhostSpot
  vanishedAt: number
}

const SCREAM: SoundName = "jumpscare"

const GHOST_SOUNDS: SoundName[] = ["pianoSting", "violinStinger", "violinStinger2", SCREAM]

const MAX_FRAME_SECONDS = 0.1

const SENT_AWAY_FADE_SECONDS = 0.2

const SHOWN = 1

const HIDDEN = 0

export function useGhostAttack(
  ghost: Object3D,
  clips: AnimationClip[],
  soundSpot: RefObject<Object3D | null>,
) {
  const { settings, sound } = useGhostTuning()
  const emitter = useSoundEmitter(soundSpot, {
    bus: "effects",
    shape: sound.shape,
    presence: inHouse,
  })
  const mixer = useMemo(() => new AnimationMixer(ghost), [ghost])
  const actions = useMemo(
    () => ({
      idle: mixer.clipAction(clipNamed(clips, IDLE_CLIP)),
      walk: mixer.clipAction(clipNamed(clips, WALK_CLIP)),
    }),
    [mixer, clips],
  )
  const chase = useRef<Chase | null>(null)
  const scream = useRef<SoundLoop | null>(null)

  useEffect(() => preloadSounds(GHOST_SOUNDS), [])

  useEffect(() => {
    if (scream.current) tuneLoop(scream.current, screamSettings(sound))
  }, [sound])

  useEffect(
    () => () => {
      silence(SENT_AWAY_FADE_SECONDS)
      mixer.stopAllAction()
    },
    [mixer],
  )

  useFrame((_, delta) => {
    const { ghostAttack } = hauntState
    if (!ghostAttack) {
      sendAway()
      return
    }
    if (chase.current?.attack !== ghostAttack) chase.current = appear(ghostAttack)
    const current = chase.current
    const seconds = Math.min(delta, MAX_FRAME_SECONDS)
    if (current.stage === "waiting") waitFor(current)
    if (current.stage === "chasing") follow(current, seconds)
    if (current.stage === "vanishing") vanish(current, seconds)
    show(current)
    if (current.stage !== "gone") mixer.update(seconds)
  })

  function appear(attack: GhostAttack): Chase {
    silence(SENT_AWAY_FADE_SECONDS)
    mixer.stopAllAction()
    actions.idle.reset().play()
    return {
      attack,
      stage: "waiting",
      sighted: false,
      spot: homeOf(settings),
      vanishedAt: 0,
    }
  }

  function waitFor(current: Chase) {
    current.spot = homeOf(settings)
    if (loopState.whereabouts !== "house") return
    const { eye, yaw } = playerPose
    if (
      !current.sighted &&
      inSecondCorridor(eye) &&
      looksAtGhost(eye, yaw, current.spot, settings.sightFacing)
    ) {
      current.sighted = true
      playSound("pianoSting", { volume: sound.sighting, tone: sound.tone })
    }
    if (flatDistance(current.spot, eye) > settings.wakeDistance) return
    current.sighted = true
    current.stage = "chasing"
    actions.walk.reset().play()
    actions.idle.crossFadeTo(actions.walk, settings.blendSeconds, false)
    playSound("violinStinger", { volume: sound.wake, tone: sound.tone })
  }

  function follow(current: Chase, seconds: number) {
    scream.current ??= startScream(emitter.current, sound)
    walkToward(current.spot, playerPose.eye, settings, seconds)
    actions.walk.timeScale = settings.speed / (settings.walkClipSpeed * settings.size)
    if (flatDistance(current.spot, playerPose.eye) > settings.catchDistance) return
    current.stage = "vanishing"
    current.vanishedAt = nightClock()
    playSound("violinStinger2", { volume: sound.vanish, tone: sound.tone })
    silence(settings.fadeSeconds)
  }

  function vanish(current: Chase, seconds: number) {
    walkToward(current.spot, playerPose.eye, settings, seconds)
    const faded = (nightClock() - current.vanishedAt) / settings.fadeSeconds
    if (faded >= 1) current.stage = "gone"
  }

  function show({ stage, spot, vanishedAt }: Chase) {
    const fade =
      stage === "vanishing" ? 1 - (nightClock() - vanishedAt) / settings.fadeSeconds : SHOWN
    ghostLook.fade.value = stage === "gone" ? HIDDEN : Math.max(fade, HIDDEN)
    ghost.scale.setScalar(stage === "gone" ? HIDDEN : settings.size)
    ghost.position.set(spot.x, 0, spot.z)
    ghost.rotation.y = spot.yaw
  }

  function sendAway() {
    if (!chase.current && ghost.scale.x === HIDDEN) return
    chase.current = null
    silence(SENT_AWAY_FADE_SECONDS)
    mixer.stopAllAction()
    ghost.scale.setScalar(HIDDEN)
  }

  function silence(seconds: number) {
    if (scream.current) fadeOutLoop(scream.current, seconds)
    scream.current = null
  }
}

function homeOf(settings: GhostSettings) {
  return ghostHome(FIRST_CORRIDOR, placedCoatRack, settings)
}

function startScream(emitter: SoundEmitter | null, sound: GhostSound) {
  const engine = audioEngine()
  const buffer = bufferOf(SCREAM)
  if (!engine || !buffer || !emitter) return null
  return startLoop(
    engine,
    SCREAM,
    buffer,
    emitter.input,
    screamSettings(sound),
    0,
    sound.loopFadeIn,
  )
}

function screamSettings({ loop, tone }: GhostSound) {
  return { volume: loop, pitch: 0, tone }
}

function clipNamed(clips: AnimationClip[], name: string) {
  const clip = clips.find((candidate) => candidate.name === name)
  if (!clip) throw new Error(`The Ghost Model has no "${name}" clip; export it again`)
  return clip
}

function inHouse() {
  return loopState.houseLevel
}
