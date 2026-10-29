import { useFrame } from "@react-three/fiber"
import { type RefObject, useRef } from "react"
import type { Matrix4, Object3D } from "three"
import { nightClock } from "@/night/nightClock"
import { doorFlicker } from "./doorFlicker"
import { type LeafPose, RESTING_LEAF } from "./doorRattle"
import { shakenLeafMatrix } from "./doorWall"
import { useAjarDoor } from "./useAjarDoor"
import { useDoorRattle } from "./useDoorRattle"

type ShownLeaf = LeafPose & { open: number; frame: Matrix4 | null }

export function useDoorLeaf(
  leaf: RefObject<Object3D | null>,
  emitterSpot: RefObject<Object3D | null>,
  frame: Matrix4,
  open: number,
) {
  const rattle = useDoorRattle(emitterSpot)
  const ajar = useAjarDoor(emitterSpot, frame, rattle.settings)
  const pose = useRef<LeafPose>({ ...RESTING_LEAF })
  const shown = useRef<ShownLeaf>({ ...RESTING_LEAF, open: Number.NaN, frame: null })

  useFrame(() => {
    const now = nightClock()
    const current = pose.current
    Object.assign(current, RESTING_LEAF)
    doorFlicker.lantern = null
    rattle.step(current, now)
    ajar(current, now)
    if (!leaf.current || sameLeaf(shown.current, current, open, frame)) return
    Object.assign(shown.current, current, { open, frame })
    shakenLeafMatrix(frame, open, current, leaf.current.matrix)
    leaf.current.matrixWorldNeedsUpdate = true
  })
}

function sameLeaf(shown: ShownLeaf, pose: LeafPose, open: number, frame: Matrix4) {
  return (
    shown.frame === frame &&
    shown.open === open &&
    shown.angle === pose.angle &&
    shown.offset === pose.offset &&
    shown.tilt === pose.tilt
  )
}
