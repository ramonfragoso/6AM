import { useFrame } from "@react-three/fiber"
import { type RefObject, useEffect, useMemo, useRef, useState } from "react"
import type { Object3D } from "three"
import { hauntState } from "@/haunts/hauntState"
import { nightClock } from "@/night/nightClock"
import { loopState } from "@/passage/loopState"
import { preloadSounds } from "@/sound/audioEngine"
import { playSound } from "@/sound/playSound"
import type { SoundEmitter } from "@/sound/soundEmitter"
import { toneOf } from "@/sound/soundSliders"
import { useSoundEmitter } from "@/sound/useSoundEmitter"
import {
  CHAIR_MOVE_SECONDS,
  type ChairMove,
  type ChairMoveSettings,
  chairMoveShare,
  movedChairMatrix,
  movedChairSpot,
} from "./chairMove"
import { refreshStaticShadows } from "./FlameLights"
import type { FurnitureSpot } from "./propPlacements"
import { useChairMoveTuning } from "./useChairMoveTuning"

type ChairSound = ReturnType<typeof useChairMoveTuning>["sound"]

type ShownChair = { share: number; spot: FurnitureSpot | null; settings: ChairMoveSettings | null }

const MILLISECONDS = 1000

const MOVED = 1

export function useChairMove(
  chair: RefObject<Object3D | null>,
  soundSpot: RefObject<Object3D | null>,
  spot: FurnitureSpot,
) {
  const { settings, sound } = useChairMoveTuning()
  const emitter = useSoundEmitter(soundSpot, {
    bus: "effects",
    shape: sound.shape,
    presence: inHouse,
  })
  const sounded = useRef<ChairMove | null>(null)
  const shown = useRef<ShownChair>({ share: Number.NaN, spot: null, settings: null })
  const [moved, setMoved] = useState(false)
  const standing = useMemo(
    () => (moved ? movedChairSpot(spot, settings) : spot),
    [moved, spot, settings],
  )

  useEffect(() => preloadSounds(["chairMove"]), [])
  useEffect(() => refreshStaticShadows(), [standing])

  useFrame(() => {
    const { chairMove } = hauntState
    const seconds = chairMove ? nightClock() - chairMove.startedAt : 0
    if (chairMove && sounded.current !== chairMove) {
      const done = seconds > CHAIR_MOVE_SECONDS || soundChair(emitter.current, sound, seconds)
      if (done) sounded.current = chairMove
    }
    const share = chairMove ? chairMoveShare(seconds, settings.acceleration) : 0
    if (share >= MOVED !== moved) setMoved(share >= MOVED)
    const last = shown.current
    if (
      !chair.current ||
      (last.share === share && last.spot === spot && last.settings === settings)
    )
      return
    Object.assign(last, { share, spot, settings })
    movedChairMatrix(spot, settings, share, chair.current.matrix)
    chair.current.matrixWorldNeedsUpdate = true
  })

  return standing
}

function soundChair(
  emitter: SoundEmitter | null,
  { volume, muffle, offset }: ChairSound,
  seconds: number,
) {
  if (!emitter) return false
  return playSound("chairMove", {
    from: emitter,
    volume,
    tone: toneOf(muffle),
    delay: offset / MILLISECONDS - seconds,
  })
}

function inHouse() {
  return loopState.houseLevel
}
