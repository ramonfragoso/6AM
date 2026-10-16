import { useFrame, useThree } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { type RefObject, useRef } from "react"
import { Object3D, Vector3 } from "three"
import { useViewpoint } from "@/debugPlayer/useViewpoint"
import { usePassage } from "@/passage/usePassage"
import { READ_INPUT_PRIORITY } from "@/world/physicsSettings"
import { playerPose } from "./playerPose"
import { STANDING_STILL, usePlayerControls, type PlayerControls } from "./usePlayerControls"
import { usePlayerTuning } from "./usePlayerTuning"
import { createView, lookAlong, turnView } from "./view"

const UP = new Vector3(0, 1, 0)

export function usePlayerMovement(spawnYaw: number, prompt: RefObject<HTMLElement | null>) {
  const body = useRef<RapierRigidBody>(null)
  const eye = useRef<Object3D>(null!)
  const view = useRef(createView(spawnYaw))
  const camera = useThree((state) => state.camera)
  const readControls = usePlayerControls()
  const { walkSpeed, eyeHeight, capsuleRadius } = usePlayerTuning()
  const viewed = useViewpoint() === "Player"
  const passage = usePassage({ body, view, eyeHeight }, prompt, viewed)

  useFrame(({ clock }, delta) => {
    const read = readControls(delta)
    const passing = passage.update(clock.elapsedTime, delta)
    const controls = viewed && !passing ? read : STANDING_STILL
    turnView(view.current, controls.look)
    if (body.current && !passing) walk(body.current, controls, view.current.y, walkSpeed)
  }, READ_INPUT_PRIORITY)

  useFrame(() => {
    const held = passage.cameraPose()
    if (held) playerPose.eye.copy(held.eye)
    else eye.current.getWorldPosition(playerPose.eye)
    playerPose.yaw = held ? held.yaw : view.current.y
    if (!viewed) return
    camera.position.copy(playerPose.eye)
    if (held) lookAlong(camera.rotation, held.pitch, held.yaw)
    else camera.rotation.copy(view.current)
  })

  return {
    body,
    eye,
    eyeHeight,
    capsuleRadius,
  }
}

function walk(body: RapierRigidBody, controls: PlayerControls, yaw: number, walkSpeed: number) {
  const direction = new Vector3(controls.walk.x, 0, -controls.walk.y).applyAxisAngle(UP, yaw)
  const fallSpeed = body.linvel().y
  body.setLinvel({ x: direction.x * walkSpeed, y: fallSpeed, z: direction.z * walkSpeed }, true)
}
