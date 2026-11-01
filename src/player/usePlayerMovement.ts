import { useFrame, useThree } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { type RefObject, useRef } from "react"
import { Object3D, Vector3 } from "three"
import type { CameraOffset } from "@/camera/cameraMotion"
import { placeCamera, useCameraMotion } from "@/camera/useCameraMotion"
import { useViewpoint } from "@/debugPlayer/useViewpoint"
import { strangleView } from "@/ghost/strangleView"
import { usePassage } from "@/passage/usePassage"
import { emitStep } from "@/steps/stepEvents"
import { useTitleCamera } from "@/title/useTitleCamera"
import { READ_INPUT_PRIORITY } from "@/world/physicsSettings"
import { playerPose } from "./playerPose"
import { STANDING_STILL, usePlayerControls, type PlayerControls } from "./usePlayerControls"
import { useGait } from "./useGait"
import { usePlayerTuning } from "./usePlayerTuning"
import { createView, turnView } from "./view"

const UP = new Vector3(0, 1, 0)

const STILL: CameraOffset = { position: new Vector3(), pitch: 0, roll: 0 }

const standingEye = new Vector3()

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
  const titleCamera = useTitleCamera()

  useFrame(({ clock }, delta) => {
    const read = readControls(delta)
    const passing = passage.update(clock.elapsedTime, delta)
    const controls = viewed && !passing ? read : STANDING_STILL
    turnView(view.current, controls.look)
    if (body.current && !passing) walk(body.current, controls, view.current.y, walkSpeed)
  }, READ_INPUT_PRIORITY)

  useFrame((_, delta) => {
    const strangled = strangleView.pose
    eye.current.getWorldPosition(standingEye)
    const titled = titleCamera({ eye: standingEye, yaw: view.current.y, pitch: view.current.x })
    const still = strangled ?? titled
    const held = still ?? passage.cameraPose()
    playerPose.eye.copy(held ? held.eye : standingEye)
    playerPose.yaw = held ? held.yaw : view.current.y
    playerPose.pitch = held ? held.pitch : view.current.x
    const offset = advanceCameraMotion(gaitOf(delta, playerPose.eye, !held))
    if (!viewed) return
    placeCamera(camera, playerPose.eye, playerPose.pitch, playerPose.yaw, still ? STILL : offset)
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
