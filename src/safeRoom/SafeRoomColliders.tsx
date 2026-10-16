import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { Vector3, type Vector3Tuple } from "three"
import { DOOR_LINE, ROOM_HALF_WIDTH, ROOM_HEIGHT, ROOMS, roomMatrix, SAFE_ROOMS } from "./safeRooms"

const WALL_THICKNESS = 0.2

const FLOOR_THICKNESS = 0.2

const HALF_WALL = WALL_THICKNESS / 2

const OUTER_HALF_WIDTH = ROOM_HALF_WIDTH + WALL_THICKNESS

const OUTER_HALF_DEPTH = DOOR_LINE + HALF_WALL

type Box = { center: Vector3Tuple; halfExtents: Vector3Tuple }

const ROOM_BOXES: Box[] = [
  {
    center: [0, -FLOOR_THICKNESS / 2, 0],
    halfExtents: [OUTER_HALF_WIDTH, FLOOR_THICKNESS / 2, OUTER_HALF_DEPTH],
  },
  ...[-1, 1].flatMap((side): Box[] => [
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
  return (
    <RigidBody type="fixed" colliders={false}>
      {ROOMS.flatMap((room) =>
        ROOM_BOXES.map(({ center, halfExtents }, index) => (
          <CuboidCollider
            key={`${room}-${index}`}
            args={halfExtents}
            position={new Vector3(...center).applyMatrix4(roomMatrix(room)).toArray()}
            rotation={[0, SAFE_ROOMS[room].rotationY, 0]}
          />
        )),
      )}
    </RigidBody>
  )
}
