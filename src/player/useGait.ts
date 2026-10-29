import { type RapierRigidBody, useRapier } from "@react-three/rapier"
import { type RefObject, useCallback, useMemo, useRef } from "react"
import { Vector3 } from "three"
import type { Gait } from "@/camera/cameraMotion"

const PROBE_ABOVE_FEET = 0.1

const GROUND_REACH = 0.25

const TELEPORT_SPEED = 20

const SOLID = true

export function useGait(body: RefObject<RapierRigidBody | null>) {
  const { world, rapier } = useRapier()
  const ray = useMemo(() => new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }), [rapier])
  const lastEye = useRef<Vector3 | null>(null)

  const isGrounded = useCallback(() => {
    const own = body.current
    if (!own || !own.isEnabled()) return true
    const feet = own.translation()
    ray.origin = { x: feet.x, y: feet.y + PROBE_ABOVE_FEET, z: feet.z }
    const reach = PROBE_ABOVE_FEET + GROUND_REACH
    return world.castRay(ray, reach, SOLID, undefined, undefined, undefined, own) !== null
  }, [body, ray, world])

  return useCallback(
    (delta: number, eye: Vector3, walkable: boolean): Gait => {
      const last = lastEye.current
      const travelled =
        walkable && last && delta > 0 ? Math.hypot(eye.x - last.x, eye.z - last.z) : 0
      const speed = travelled / Math.max(delta, Number.EPSILON)
      if (!walkable) lastEye.current = null
      else if (last) last.copy(eye)
      else lastEye.current = eye.clone()
      return {
        delta,
        speed: speed > TELEPORT_SPEED ? 0 : speed,
        grounded: isGrounded(),
      }
    },
    [isGrounded],
  )
}
