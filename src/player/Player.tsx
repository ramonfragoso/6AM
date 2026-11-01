import { CapsuleCollider, RigidBody } from "@react-three/rapier"
import type { RefObject } from "react"
import type { Vector3Tuple } from "three"
import { startRoomSpawn } from "@/passage/spawn"
import { useStepSounds } from "@/steps/useStepSounds"
import { useZoom } from "@/zoom/useZoom"
import { useZoomTutorial } from "@/zoom/useZoomTutorial"
import { usePlayerMovement } from "./usePlayerMovement"

const SPAWN = startRoomSpawn()

const PLAYER_HEIGHT = 1.6

const SLIDES_ALONG_WALLS = 0

type PlayerProps = {
  prompt: RefObject<HTMLElement | null>
  zoomTutorial: RefObject<HTMLElement | null>
}

export function Player({ prompt, zoomTutorial }: PlayerProps) {
  const { body, eye, eyeHeight, capsuleRadius } = usePlayerMovement(SPAWN.yaw, prompt)
  useStepSounds()
  useZoom()
  useZoomTutorial(zoomTutorial)
  const capsuleHalfHeight = PLAYER_HEIGHT / 2 - capsuleRadius
  const capsuleCenter: Vector3Tuple = [0, PLAYER_HEIGHT / 2, 0]

  return (
    <RigidBody ref={body} colliders={false} position={SPAWN.feet} lockRotations canSleep={false}>
      <CapsuleCollider
        args={[capsuleHalfHeight, capsuleRadius]}
        position={capsuleCenter}
        friction={SLIDES_ALONG_WALLS}
      />
      <object3D ref={eye} position={[0, eyeHeight, 0]} />
    </RigidBody>
  )
}
