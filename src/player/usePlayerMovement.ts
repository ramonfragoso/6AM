import { useFrame, useThree } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { type RefObject, useRef } from "react"
import { Object3D, Vector3 } from "three"
import { placeCamera, useCameraMotion } from "@/camera/useCameraMotion"
import { useViewpoint } from "@/debugPlayer/useViewpoint"
import { usePassage } from "@/passage/usePassage"
import { emitStep } from "@/steps/stepEvents"
import { READ_INPUT_PRIORITY } from "@/world/physicsSettings"
import { playerPose } from "./playerPose"
import { STANDING_STILL, usePlayerControls, type PlayerControls } from "./usePlayerControls"
import { useGait } from "./useGait"
import { usePlayerTuning } from "./usePlayerTuning"
import { createView, turnView } from "./view"

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
  const gaitOf = useGait(body)
  const advanceCameraMotion = useCameraMotion(emitStep)

  useFrame(({ clock }, delta) => {
    const read = readControls(delta)
    const passing = passage.update(clock.elapsedTime, delta)
    const controls = viewed && !passing ? read : STANDING_STILL
    turnView(view.current, controls.look)
    if (body.current && !passing) walk(body.current, controls, view.current.y, walkSpeed)
  }, READ_INPUT_PRIORITY)

  useFrame((_, delta) => {
    const held = passage.cameraPose()
    if (held) playerPose.eye.copy(held.eye)
    else eye.current.getWorldPosition(playerPose.eye)
    playerPose.yaw = held ? held.yaw : view.current.y
    const offset = advanceCameraMotion(gaitOf(delta, playerPose.eye, !held))
    if (!viewed) return
    const pitch = held ? held.pitch : view.current.x
    placeCamera(camera, playerPose.eye, pitch, playerPose.yaw, offset)
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
