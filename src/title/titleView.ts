import { MathUtils, Vector3 } from "three"
import { type Pose, wrappedAngle, yawAlong } from "@/passage/passage"
import type { TitleSettings } from "./titleSettings"

type ViewDistances = Pick<TitleSettings, "distance" | "height" | "lookHeight">

export function titleViewPose(clock: Vector3, spawn: Pose, settings: ViewDistances): Pose {
  const target = clock.clone().setY(clock.y + settings.lookHeight)
  const towardSpawn = spawn.eye.clone().sub(target).setY(0).normalize()
  const eye = target
    .clone()
    .addScaledVector(towardSpawn, settings.distance)
    .setY(target.y + settings.height)
  const toTarget = target.clone().sub(eye)
  const level = Math.hypot(toTarget.x, toTarget.z)
  return { eye, yaw: yawAlong(toTarget.setY(0)), pitch: Math.atan2(toTarget.y, level) }
}

export function openingPose(from: Pose, to: Pose, progress: number): Pose {
  const eased = MathUtils.smootherstep(progress, 0, 1)
  return {
    eye: from.eye.clone().lerp(to.eye, eased),
    yaw: from.yaw + wrappedAngle(to.yaw - from.yaw) * eased,
    pitch: MathUtils.lerp(from.pitch, to.pitch, eased),
  }
}
