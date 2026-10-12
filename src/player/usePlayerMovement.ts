import { useFrame, useThree } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { useRef } from "react"
import { Object3D, Vector3 } from "three"
import { useViewpoint } from "@/debugPlayer/useViewpoint"
import { READ_INPUT_PRIORITY } from "@/world/physicsSettings"
import { STANDING_STILL, usePlayerControls, type PlayerControls } from "./usePlayerControls"
import { usePlayerTuning } from "./usePlayerTuning"
import { createView, turnView } from "./view"

const UP = new Vector3(0, 1, 0)

export function usePlayerMovement() {
  const body = useRef<RapierRigidBody>(null)
  const eye = useRef<Object3D>(null!)
  const view = useRef(createView())
  const camera = useThree((state) => state.camera)
  const readControls = usePlayerControls()
  const { walkSpeed, eyeHeight, capsuleRadius } = usePlayerTuning()
  const viewed = useViewpoint() === "Player"

  useFrame((_, delta) => {
    const read = readControls(delta)
    const controls = viewed ? read : STANDING_STILL
    turnView(view.current, controls.look)
    if (body.current) walk(body.current, controls, view.current.y, walkSpeed)
  }, READ_INPUT_PRIORITY)

  useFrame(() => {
    if (!viewed) return
    eye.current.getWorldPosition(camera.position)
    camera.rotation.copy(view.current)
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
