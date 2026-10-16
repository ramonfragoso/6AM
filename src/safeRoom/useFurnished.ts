import { useFrame } from "@react-three/fiber"
import type { RapierRigidBody } from "@react-three/rapier"
import { type RefObject, useRef } from "react"
import type { Matrix4, Object3D } from "three"
import { FURNISH_PRIORITY } from "@/world/physicsSettings"
import { furnishedPose, furnishedRoomMatrix } from "./furnishedRoom"

type Placed = {
  room: Matrix4
  local: Matrix4
  group: Object3D
  body: RapierRigidBody | null
}

export function useFurnished(
  group: RefObject<Object3D>,
  body: RefObject<RapierRigidBody | null>,
  local: Matrix4,
) {
  const placed = useRef<Placed | null>(null)

  useFrame(() => {
    const now = {
      room: furnishedRoomMatrix(),
      local,
      group: group.current,
      body: body.current,
    }
    if (placed.current && samePlacement(placed.current, now)) return
    placed.current = now
    const {
      position: [x, y, z],
      quaternion: [qx, qy, qz, qw],
    } = furnishedPose(local, now.group.matrix)
    now.group.matrixWorldNeedsUpdate = true
    if (!now.body) return
    now.body.setTranslation({ x, y, z }, true)
    now.body.setRotation(
      {
        x: qx,
        y: qy,
        z: qz,
        w: qw,
      },
      true,
    )
  }, FURNISH_PRIORITY)
}

function samePlacement(a: Placed, b: Placed) {
  return a.room === b.room && a.local === b.local && a.group === b.group && a.body === b.body
}
