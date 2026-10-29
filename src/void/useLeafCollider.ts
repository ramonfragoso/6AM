import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { type RefObject, useRef } from "react"
import { Matrix4, Quaternion, Vector3 } from "three"
import { doorLeafMatrix } from "@/doorWall/doorWall"
import { loopState } from "@/passage/loopState"
import { doorFrameMatrix } from "@/safeRoom/safeRooms"
import { FURNISH_PRIORITY } from "@/world/physicsSettings"
import { VOID_DOORWAY } from "./voidOpen"

export type LeafPlacement = { position: Vector3; quaternion: Quaternion }

const FRAME = doorFrameMatrix(VOID_DOORWAY)

const SHUT = 0

const leaf = new Matrix4()

const scale = new Vector3()

export function leafPlacement(angle = SHUT, target: LeafPlacement = newLeafPlacement()) {
  doorLeafMatrix(FRAME, angle, leaf).decompose(target.position, target.quaternion, scale)
  return target
}

export function useLeafCollider(body: RefObject<RapierRigidBody | null>) {
  const placedAt = useRef(SHUT)
  const placement = useRef(newLeafPlacement())

  useFrame(() => {
    const angle = loopState.leafAngles[VOID_DOORWAY]
    if (!body.current || angle === placedAt.current) return
    placedAt.current = angle
    const { position, quaternion } = leafPlacement(angle, placement.current)
    body.current.setNextKinematicTranslation(position)
    body.current.setNextKinematicRotation(quaternion)
  }, FURNISH_PRIORITY)
}

function newLeafPlacement(): LeafPlacement {
  return { position: new Vector3(), quaternion: new Quaternion() }
}
