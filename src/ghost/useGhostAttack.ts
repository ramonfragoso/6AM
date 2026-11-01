import { useFrame } from "@react-three/fiber"
import { type RefObject, useEffect, useMemo, useRef, useState } from "react"
import { type AnimationClip, AnimationMixer, type Object3D } from "three"
import { advanceBlackout, type Blackout, cancelBlackout, startBlackout } from "@/blackout/blackout"
import { inSecondCorridor } from "@/haunts/triggers"
import { hauntState } from "@/haunts/hauntState"
import { FIRST_CORRIDOR } from "@/kit/house"
import { endLoop, nightState } from "@/night/night"
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
import { HAUNT_PRIORITY } from "@/world/physicsSettings"
import {
  flatDistance,
  type GhostAttack,
  ghostHome,
  type GhostSpot,
  IDLE_CLIP,
  looksAtGhost,
  STRANGLE_CLIP,
  WALK_CLIP,
  walkToward,
} from "./ghost"
import { createShake, SHAKEN_BONES, type ShakenBone, shakeBones } from "./ghostShake"
import {
  createStrangleCamera,
  followStrangle,
  STRANGLE_BONE_NAMES,
  type StrangleBones,
  type StrangleCamera,
  type StrangleSettings,
  strangleTarget,
} from "./strangleCamera"
import { strangleView } from "./strangleView"
import { type GhostSettings, type GhostSound, useGhostTuning } from "./useGhostTuning"

type Stage = "waiting" | "chasing" | "strangling" | "gone"

type Strangle = { grabbedAt: number; camera: StrangleCamera; blackout: Blackout }

type Chase = {
  attack: GhostAttack
  stage: Stage
  sighted: boolean
  spot: GhostSpot
  strangle: Strangle | null
}

const SCREAM: SoundName = "jumpscare"

const GHOST_SOUNDS: SoundName[] = ["pianoSting", "violinStinger", "violinStinger2", SCREAM]

const MAX_FRAME_SECONDS = 0.1

const SENT_AWAY_FADE_SECONDS = 0.2

const SILENCED_AT_ONCE = 0

const HIDDEN = 0

export function useGhostAttack(
  ghost: Object3D,
  clips: AnimationClip[],
  soundSpot: RefObject<Object3D | null>,
) {
  const { settings, strangle, shake: shakeSettings, sound } = useGhostTuning()
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
      strangle: mixer.clipAction(clipNamed(clips, STRANGLE_CLIP)),
    }),
    [mixer, clips],
  )
  const strangleBones = useMemo(() => strangleBonesOf(ghost), [ghost])
  const shakenBones = useMemo(() => shakenBonesOf(ghost), [ghost])
  const [shake] = useState(() => createShake(SHAKEN_BONES.length))
  const chase = useRef<Chase | null>(null)
  const scream = useRef<SoundLoop | null>(null)

  useEffect(() => preloadSounds(GHOST_SOUNDS), [])

  useEffect(() => {
    if (scream.current) tuneLoop(scream.current, screamSettings(sound))
  }, [sound])

  useEffect(
    () => () => {
      release(chase.current)
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
    show(current)
    if (current.stage === "gone") return
    mixer.update(seconds)
    shakeBones(shake, shakenBones, shakeSettings, seconds)
    if (current.stage === "strangling") holdPlayer(current, seconds)
  }, HAUNT_PRIORITY)

  function appear(attack: GhostAttack): Chase {
    release(chase.current)
    silence(SENT_AWAY_FADE_SECONDS)
    mixer.stopAllAction()
    actions.idle.reset().play()
    return {
      attack,
      stage: "waiting",
      sighted: false,
      spot: homeOf(settings),
      strangle: null,
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
    if (!canStrangle() || flatDistance(current.spot, playerPose.eye) > settings.catchDistance) {
      return
    }
    const now = nightClock()
    current.stage = "strangling"
    current.strangle = {
      grabbedAt: now,
      camera: createStrangleCamera(playerPose),
      blackout: startBlackout(now),
    }
    actions.strangle.reset().play()
    actions.walk.crossFadeTo(actions.strangle, strangle.grabBlend, false)
    playSound("violinStinger2", { volume: sound.strangle, tone: sound.tone })
  }

  function holdPlayer(current: Chase, seconds: number) {
    const held = current.strangle!
    const now = nightClock()
    ghost.updateMatrixWorld(true)
    const target = strangleTarget(strangleBones, current.spot.yaw, strangle)
    strangleView.pose = followStrangle(held.camera, target, strangle, now - held.grabbedAt, seconds)
    if (!advanceBlackout(held.blackout, now, blackoutTiming(strangle))) return
    current.stage = "gone"
    current.strangle = null
    strangleView.pose = null
    silence(SILENCED_AT_ONCE)
    endLoop("strangled")
  }

  function show({ stage, spot }: Chase) {
    ghost.scale.setScalar(stage === "gone" ? HIDDEN : settings.size)
    ghost.position.set(spot.x, 0, spot.z)
    ghost.rotation.y = spot.yaw
  }

  function sendAway() {
    if (!chase.current && ghost.scale.x === HIDDEN) return
    release(chase.current)
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

function release(current: Chase | null) {
  if (!current?.strangle) return
  cancelBlackout(current.strangle.blackout)
  current.strangle = null
  strangleView.pose = null
}

function canStrangle() {
  return nightState.phase === "playing" && loopState.whereabouts === "house" && !loopState.passing
}

function blackoutTiming({ holdSeconds, fadeOut, blackSeconds, fadeIn }: StrangleSettings) {
  return {
    before: holdSeconds,
    fadeOut,
    soundOut: SILENCED_AT_ONCE,
    black: blackSeconds,
    fadeIn,
  }
}

function homeOf(settings: GhostSettings) {
  return ghostHome(FIRST_CORRIDOR, placedCoatRack, settings)
}

function strangleBonesOf(ghost: Object3D) {
  return Object.fromEntries(
    Object.entries(STRANGLE_BONE_NAMES).map(([part, name]) => [part, boneNamed(ghost, name)]),
  ) as StrangleBones
}

function shakenBonesOf(ghost: Object3D): ShakenBone[] {
  return SHAKEN_BONES.map(({ name, head }) => ({ bone: boneNamed(ghost, name), head }))
}

function boneNamed(ghost: Object3D, name: string) {
  const bone = ghost.getObjectByName(name)
  if (!bone) throw new Error(`The Ghost Model has no "${name}" bone; export it again`)
  return bone
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
