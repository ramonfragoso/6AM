import {
  CuboidCollider,
  type RapierCollider,
  type RapierRigidBody,
  RigidBody,
} from "@react-three/rapier"
import { type RefObject, useMemo, useRef } from "react"
import { Box3, Vector3, type Vector3Tuple } from "three"
import { LEAF_THICKNESS } from "@/doorWall/doorWall"
import { DOORWAY_HALF_WIDTH, DOORWAY_HEIGHT } from "@/kit/KitColliders"
import { placementMatrix } from "@/kit/KitInstances"
import type { Kit } from "@/kit/useKit"
import {
  OUTER_HALF_WIDTH,
  ROOM_WALL_THICKNESS,
  type RoomBox,
  RoomBoxCollider,
} from "@/safeRoom/SafeRoomColliders"
import { DOOR_LINE, ROOM_HEIGHT } from "@/safeRoom/safeRooms"
import { useEnabledWhile } from "./useEnabledWhile"
import { leafPlacement } from "./useLeafCollider"
import { VOID_ROOM, voidOpen } from "./voidOpen"
import { VOID_FLOOR } from "./voidSpace"

const JAMB_HALF_WIDTH = (OUTER_HALF_WIDTH - DOORWAY_HALF_WIDTH) / 2

const LINTEL_HALF_HEIGHT = (ROOM_HEIGHT - DOORWAY_HEIGHT) / 2

const DOORWAY_WALL_BOXES: RoomBox[] = [
  ...[-1, 1].map((side): RoomBox => ({
    center: [side * (DOORWAY_HALF_WIDTH + JAMB_HALF_WIDTH), ROOM_HEIGHT / 2, DOOR_LINE],
    halfExtents: [JAMB_HALF_WIDTH, ROOM_HEIGHT / 2, ROOM_WALL_THICKNESS / 2],
  })),
  {
    center: [0, DOORWAY_HEIGHT + LINTEL_HALF_HEIGHT, DOOR_LINE],
    halfExtents: [DOORWAY_HALF_WIDTH, LINTEL_HALF_HEIGHT, ROOM_WALL_THICKNESS / 2],
  },
]

const LEAF_WIDTH = 1.46

const LEAF_HEIGHT = 2.8

const LEAF_HALF_EXTENTS: Vector3Tuple = [LEAF_WIDTH / 2, LEAF_HEIGHT / 2, LEAF_THICKNESS / 2]

const LEAF_CENTER: Vector3Tuple = [-LEAF_WIDTH / 2, LEAF_HEIGHT / 2, -LEAF_THICKNESS / 2]

const SHUT_LEAF = leafPlacement()

type FloorBox = { center: Vector3Tuple; halfExtents: Vector3Tuple }

type VoidCollidersProps = { kit: Kit; leaf: RefObject<RapierRigidBody | null> }

export function VoidColliders({ kit, leaf }: VoidCollidersProps) {
  const colliders = useRef<(RapierCollider | null)[]>([])
  const floor = useMemo(() => floorBox(kit), [kit])
  useEnabledWhile(colliders, voidOpen)
  const keep = (index: number) => (collider: RapierCollider | null) =>
    void (colliders.current[index] = collider)

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider ref={keep(0)} args={floor.halfExtents} position={floor.center} />
        {DOORWAY_WALL_BOXES.map((box, index) => (
          <RoomBoxCollider key={index} ref={keep(index + 1)} room={VOID_ROOM} box={box} />
        ))}
      </RigidBody>
      <RigidBody
        ref={leaf}
        type="kinematicPosition"
        colliders={false}
        position={SHUT_LEAF.position.toArray()}
        quaternion={SHUT_LEAF.quaternion.toArray()}
      >
        <CuboidCollider args={LEAF_HALF_EXTENTS} position={LEAF_CENTER} />
      </RigidBody>
    </>
  )
}

function floorBox(kit: Kit): FloorBox {
  const box = new Box3()
  for (const placement of VOID_FLOOR) {
    box.union(kit.floor.bounds.clone().applyMatrix4(placementMatrix(placement)))
  }
  const halfExtents = box.getSize(new Vector3()).multiplyScalar(0.5)
  return { center: box.getCenter(new Vector3()).toArray(), halfExtents: halfExtents.toArray() }
}
