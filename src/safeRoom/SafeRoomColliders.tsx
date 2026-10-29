import { CuboidCollider, type RapierCollider, RigidBody } from "@react-three/rapier"
import { type Ref, useRef } from "react"
import { Vector3, type Vector3Tuple } from "three"
import { useEnabledWhile } from "@/void/useEnabledWhile"
import { VOID_ROOM, voidOpen } from "@/void/voidOpen"
import {
  DOOR_LINE,
  ROOM_HALF_WIDTH,
  ROOM_HEIGHT,
  ROOMS,
  type Room,
  roomMatrix,
  SAFE_ROOMS,
} from "./safeRooms"

export const ROOM_WALL_THICKNESS = 0.2

const FLOOR_THICKNESS = 0.2

const HALF_WALL = ROOM_WALL_THICKNESS / 2

export const OUTER_HALF_WIDTH = ROOM_HALF_WIDTH + ROOM_WALL_THICKNESS

const OUTER_HALF_DEPTH = DOOR_LINE + HALF_WALL

export type RoomBox = { center: Vector3Tuple; halfExtents: Vector3Tuple }

type RoomBoxColliderProps = { room: Room; box: RoomBox; ref?: Ref<RapierCollider> }

const ROOM_BOXES: RoomBox[] = [
  {
    center: [0, -FLOOR_THICKNESS / 2, 0],
    halfExtents: [OUTER_HALF_WIDTH, FLOOR_THICKNESS / 2, OUTER_HALF_DEPTH],
  },
  ...[-1, 1].flatMap((side): RoomBox[] => [
    {
      center: [side * (ROOM_HALF_WIDTH + HALF_WALL), ROOM_HEIGHT / 2, 0],
      halfExtents: [HALF_WALL, ROOM_HEIGHT / 2, OUTER_HALF_DEPTH],
    },
    {
      center: [0, ROOM_HEIGHT / 2, side * DOOR_LINE],
      halfExtents: [OUTER_HALF_WIDTH, ROOM_HEIGHT / 2, HALF_WALL],
    },
  ]),
]

export function SafeRoomColliders() {
  const voidRoom = useRef<(RapierCollider | null)[]>([])
  useEnabledWhile(voidRoom, roomStands)

  return (
    <RigidBody type="fixed" colliders={false}>
      {ROOMS.flatMap((room) =>
        ROOM_BOXES.map((box, index) => (
          <RoomBoxCollider
            key={`${room}-${index}`}
            room={room}
            box={box}
            ref={
              room === VOID_ROOM
                ? (collider) => void (voidRoom.current[index] = collider)
                : undefined
            }
          />
        )),
      )}
    </RigidBody>
  )
}

export function RoomBoxCollider({ room, box: { center, halfExtents }, ref }: RoomBoxColliderProps) {
  return (
    <CuboidCollider
      ref={ref}
      args={halfExtents}
      position={new Vector3(...center).applyMatrix4(roomMatrix(room)).toArray()}
      rotation={[0, SAFE_ROOMS[room].rotationY, 0]}
    />
  )
}

function roomStands() {
  return !voidOpen()
}
