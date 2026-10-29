import { type RefObject, useEffect, useRef } from "react"
import type { Object3D } from "three"
import { hauntState } from "@/haunts/hauntState"
import { preloadSounds } from "@/sound/audioEngine"
import { playSound } from "@/sound/playSound"
import type { SoundEmitter } from "@/sound/soundEmitter"
import { toneOf } from "@/sound/soundSliders"
import { useSoundEmitter } from "@/sound/useSoundEmitter"
import { doorFlicker } from "./doorFlicker"
import {
  type DoorRattle,
  firstSlamAt,
  type LeafPose,
  leafPoseAt,
  planRattle,
  type RattlePlan,
  type RattleSettings,
  rattleEnd,
  soundStartOf,
} from "./doorRattle"
import { inHouse, MILLISECONDS } from "./leafSound"
import { useDoorRattleTuning } from "./useDoorRattleTuning"

type RattleSound = ReturnType<typeof useDoorRattleTuning>["sound"]

type PlannedRattle = { rattle: DoorRattle; settings: RattleSettings; plan: RattlePlan }

export type LeafStep = (pose: LeafPose, now: number) => void

export function useDoorRattle(emitterSpot: RefObject<Object3D | null>) {
  const { settings, sound } = useDoorRattleTuning()
  const emitter = useSoundEmitter(emitterSpot, {
    bus: "effects",
    shape: sound.shape,
    presence: inHouse,
  })
  const planned = useRef<PlannedRattle | null>(null)
  const sounded = useRef<DoorRattle | null>(null)

  useEffect(() => preloadSounds(["angryDoorSlam"]), [])

  const step: LeafStep = (pose, now) => {
    const { doorRattle } = hauntState
    if (!doorRattle) return
    const plan = planOf(planned, doorRattle, settings)
    const seconds = now - doorRattle.startedAt
    if (sounded.current !== doorRattle) {
      const done =
        seconds > rattleEnd(plan) || soundRattle(emitter.current, sound, settings, seconds)
      if (done) sounded.current = doorRattle
    }
    leafPoseAt(plan, seconds, pose)
    if (seconds >= firstSlamAt(plan) && seconds <= rattleEnd(plan)) {
      doorFlicker.lantern = settings.lanternFlicker
    }
  }
  return { step, settings }
}

function planOf(
  planned: RefObject<PlannedRattle | null>,
  rattle: DoorRattle,
  settings: RattleSettings,
) {
  const known = planned.current
  if (known?.rattle === rattle && known.settings === settings) return known.plan
  const plan = planRattle(rattle.seed, settings)
  planned.current = { rattle, settings, plan }
  return plan
}

function soundRattle(
  emitter: SoundEmitter | null,
  { volume, muffle, offset }: RattleSound,
  settings: RattleSettings,
  seconds: number,
) {
  if (!emitter) return false
  return playSound("angryDoorSlam", {
    from: emitter,
    volume,
    tone: toneOf(muffle),
    delay: soundStartOf(settings) + offset / MILLISECONDS - seconds,
  })
}
