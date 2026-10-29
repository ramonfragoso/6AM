import { useRef } from "react"
import type { Object3D } from "three"
import { useGhostAttack } from "./useGhostAttack"
import { useGhostModel } from "./useGhostModel"

const SOUND_HEIGHT = 1.5

export function Ghost() {
  const { ghost, clips } = useGhostModel()
  const soundSpot = useRef<Object3D>(null)
  useGhostAttack(ghost, clips, soundSpot)

  return (
    <primitive object={ghost}>
      <object3D ref={soundSpot} position-y={SOUND_HEIGHT} />
    </primitive>
  )
}
