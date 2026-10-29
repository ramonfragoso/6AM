import { useCallback, useState } from "react"
import { type Camera, Euler, Quaternion, Vector3 } from "three"
import { lookAlong } from "@/player/view"
import {
  advanceCameraMotion,
  type CameraOffset,
  createCameraMotion,
  type Gait,
} from "./cameraMotion"
import { useCameraMotionTuning } from "./useCameraMotionTuning"

const UP = new Vector3(0, 1, 0)

const look = new Euler()

const sway = new Euler()

const swayTurn = new Quaternion()

export function useCameraMotion(onStep: () => void) {
  const [motion] = useState(createCameraMotion)
  const settings = useCameraMotionTuning()

  return useCallback(
    (gait: Gait) => advanceCameraMotion(motion, gait, settings, onStep),
    [motion, settings, onStep],
  )
}

export function placeCamera(
  camera: Camera,
  eye: Vector3,
  pitch: number,
  yaw: number,
  offset: CameraOffset,
) {
  camera.position.copy(offset.position).applyAxisAngle(UP, yaw).add(eye)
  lookAlong(look, pitch, yaw)
  sway.set(offset.pitch, 0, offset.roll)
  camera.quaternion.setFromEuler(look).multiply(swayTurn.setFromEuler(sway))
}
