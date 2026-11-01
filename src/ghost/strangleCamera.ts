import { MathUtils, type Object3D, Vector3 } from "three"
import { type Pose, wrappedAngle } from "@/passage/passage"

export type StrangleBones = {
  leftHand: Object3D
  rightHand: Object3D
  head: Object3D
  headTop: Object3D
}

export type StrangleAim = { up: number; back: number; lookAt: number }

export type StrangleSettings = StrangleAim & {
  grabBlend: number
  grabSeconds: number
  lookSmoothing: number
  holdSeconds: number
  fadeOut: number
  blackSeconds: number
  fadeIn: number
}

export type StrangleCamera = { from: Pose; followed: Pose | null; pose: Pose }

export const STRANGLE_BONE_NAMES: Record<keyof StrangleBones, string> = {
  leftHand: "LeftHand",
  rightHand: "RightHand",
  head: "Head",
  headTop: "HeadTop_End",
}

const MIDPOINT = 0.5

const left = new Vector3()

const right = new Vector3()

const face = new Vector3()

const headTop = new Vector3()

const toFace = new Vector3()

export function createStrangleCamera(from: Pose): StrangleCamera {
  return { from: clonePose(from), followed: null, pose: clonePose(from) }
}

export function strangleTarget(bones: StrangleBones, ghostYaw: number, aim: StrangleAim): Pose {
  bones.leftHand.getWorldPosition(left)
  bones.rightHand.getWorldPosition(right)
  const eye = left.add(right).multiplyScalar(MIDPOINT)
  eye.y += aim.up
  eye.x -= Math.sin(ghostYaw) * aim.back
  eye.z -= Math.cos(ghostYaw) * aim.back
  bones.head.getWorldPosition(face)
  face.lerp(bones.headTop.getWorldPosition(headTop), aim.lookAt)
  toFace.subVectors(face, eye)
  return {
    eye: eye.clone(),
    yaw: Math.atan2(-toFace.x, -toFace.z),
    pitch: Math.atan2(toFace.y, Math.hypot(toFace.x, toFace.z)),
  }
}

export function followStrangle(
  camera: StrangleCamera,
  target: Pose,
  settings: StrangleSettings,
  sinceGrab: number,
  seconds: number,
) {
  const followed = (camera.followed ??= clonePose(target))
  followed.eye.copy(target.eye)
  const keep = settings.lookSmoothing > 0 ? Math.exp(-seconds / settings.lookSmoothing) : 0
  followed.yaw = target.yaw + wrappedAngle(followed.yaw - target.yaw) * keep
  followed.pitch = target.pitch + (followed.pitch - target.pitch) * keep
  const grabbed = settings.grabSeconds > 0 ? Math.min(sinceGrab / settings.grabSeconds, 1) : 1
  const share = MathUtils.smoothstep(grabbed, 0, 1)
  const { from, pose } = camera
  pose.eye.lerpVectors(from.eye, followed.eye, share)
  pose.yaw = from.yaw + wrappedAngle(followed.yaw - from.yaw) * share
  pose.pitch = MathUtils.lerp(from.pitch, followed.pitch, share)
  return pose
}

function clonePose({ eye, yaw, pitch }: Pose): Pose {
  return { eye: eye.clone(), yaw, pitch }
}
