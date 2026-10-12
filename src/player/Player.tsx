import { CapsuleCollider, RigidBody } from "@react-three/rapier"
import type { Vector3Tuple } from "three"
import { usePlayerMovement } from "./usePlayerMovement"

const SPAWN_POSITION: Vector3Tuple = [0, 0, 0]

const PLAYER_HEIGHT = 1.6

const SLIDES_ALONG_WALLS = 0

export function Player() {
  const { body, eye, eyeHeight, capsuleRadius } = usePlayerMovement()
  const capsuleHalfHeight = PLAYER_HEIGHT / 2 - capsuleRadius
  const capsuleCenter: Vector3Tuple = [0, PLAYER_HEIGHT / 2, 0]

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={SPAWN_POSITION}
      lockRotations
      canSleep={false}
    >
      <CapsuleCollider
        args={[capsuleHalfHeight, capsuleRadius]}
        position={capsuleCenter}
        friction={SLIDES_ALONG_WALLS}
      />
      <object3D ref={eye} position={[0, eyeHeight, 0]} />
    </RigidBody>
  )
}
