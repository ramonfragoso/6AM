import { type RefObject, useEffect, useMemo, useRef } from "react"
import type { Matrix4, Object3D } from "three"
import { hauntState } from "@/haunts/hauntState"
import { loopState } from "@/passage/loopState"
import { playerPose } from "@/player/playerPose"
import { preloadSounds } from "@/sound/audioEngine"
import { playSound } from "@/sound/playSound"
import type { SoundEmitter } from "@/sound/soundEmitter"
import { toneOf } from "@/sound/soundSliders"
import { useSoundEmitter } from "@/sound/useSoundEmitter"
import { DOOR_SLAM_SOUND_AT, type DoorAjar, gapOf, looksAtGap } from "./doorAjar"
import { doorFlicker } from "./doorFlicker"
import { firstSlamAt, leafPoseAt, planSlam, type RattleSettings } from "./doorRattle"
import { inHouse, MILLISECONDS } from "./leafSound"
import { useAjarDoorTuning } from "./useAjarDoorTuning"
import type { LeafStep } from "./useDoorRattle"

type SlamSound = ReturnType<typeof useAjarDoorTuning>["sound"]

type Slam = { ajar: DoorAjar; at: number | null }

const LATEST_SOUND_SECONDS = 1

export function useAjarDoor(
  emitterSpot: RefObject<Object3D | null>,
  frame: Matrix4,
  slamSettings: RattleSettings,
) {
  const { settings, sound } = useAjarDoorTuning()
  const emitter = useSoundEmitter(emitterSpot, {
    bus: "effects",
    shape: sound.shape,
    presence: inHouse,
  })
  const gap = useMemo(() => gapOf(frame), [frame])
  const plan = useMemo(() => planSlam(settings.angle, slamSettings), [settings, slamSettings])
  const slam = useRef<Slam | null>(null)
  const sounded = useRef<DoorAjar | null>(null)

  useEffect(() => preloadSounds(["doorSlam"]), [])

  const step: LeafStep = (pose, now) => {
    const { doorAjar } = hauntState
    if (!doorAjar) return
    if (slam.current?.ajar !== doorAjar) slam.current = { ajar: doorAjar, at: null }
    const current = slam.current
    if (current.at === null && isLookedAt()) current.at = now
    if (current.at === null) {
      pose.angle = settings.angle
      return
    }
    const seconds = now - current.at
    const landed = firstSlamAt(plan)
    if (sounded.current !== doorAjar) {
      const tooLate = seconds > landed + LATEST_SOUND_SECONDS
      if (tooLate || soundSlam(emitter.current, sound, seconds - landed)) {
        sounded.current = doorAjar
      }
    }
    leafPoseAt(plan, seconds, pose)
    if (seconds >= landed && seconds <= landed + settings.flickerSeconds) {
      doorFlicker.lantern = settings.flicker
    }
  }

  function isLookedAt() {
    if (loopState.whereabouts !== "house") return false
    return looksAtGap(playerPose.eye, playerPose.yaw, gap, settings)
  }

  return step
}

function soundSlam(
  emitter: SoundEmitter | null,
  { volume, muffle, offset }: SlamSound,
  sinceLanded: number,
) {
  if (!emitter) return false
  return playSound("doorSlam", {
    from: emitter,
    volume,
    tone: toneOf(muffle),
    delay: offset / MILLISECONDS - DOOR_SLAM_SOUND_AT - sinceLanded,
  })
}
