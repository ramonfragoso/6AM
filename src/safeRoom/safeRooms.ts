import { Matrix4, Quaternion, Vector3, type Vector3Tuple } from "three"
import type { DoorSpot } from "@/kit/corridorLayout"
import { HOUSE_DOORS } from "@/kit/house"

export const SAFE_ROOM_URL = "/models/safe_room.glb"

export const ROOM_PIECES = [
  "safe_room_half",
  "safe_room_doorway_wall",
  "safe_room_full_wall",
  "ceiling_lamp",
] as const

export type RoomPiece = (typeof ROOM_PIECES)[number]

export const EXTERIOR_PIECES = ["safe_room_exterior", "safe_room_exterior__end"] as const

export type ExteriorPiece = (typeof EXTERIOR_PIECES)[number]

export const ROOMS = ["start", "end"] as const

export type Room = (typeof ROOMS)[number]

export type RoomSpot = { position: Vector3Tuple; rotationY: number }

export const DOOR_LINE = 2.05

export const ROOM_HALF_WIDTH = 2

export const ROOM_HEIGHT = 3.9415

export const LAMP_LIGHT_ANCHOR = "anchor_light_ceiling_lamp"

export const DOORWAYS = ["startNear", "startFar", "endNear", "endFar"] as const

export type Doorway = (typeof DOORWAYS)[number]

const ROOM_OF_DOORWAY: Record<Doorway, Room> = {
  startNear: "start",
  startFar: "start",
  endNear: "end",
  endFar: "end",
}

const FAR_DOORWAYS: ReadonlySet<Doorway> = new Set(["startFar", "endFar"])

const EXTERIOR_OF_ROOM: Record<Room, ExteriorPiece> = {
  start: "safe_room_exterior",
  end: "safe_room_exterior__end",
}

const HALF_TURN_ANGLE = Math.PI

const UP = new Vector3(0, 1, 0)

const IDENTITY = new Matrix4()

export const HALF_TURN = new Matrix4().makeRotationY(HALF_TURN_ANGLE)

const NEAR_DOOR_FRAME = new Matrix4()
  .makeTranslation(0, 0, DOOR_LINE)
  .multiply(new Matrix4().makeRotationY(HALF_TURN_ANGLE))

export const SAFE_ROOMS: Record<Room, RoomSpot> = {
  start: roomBehind(HOUSE_DOORS.start),
  end: roomBehind(HOUSE_DOORS.end),
}

export type RoomPart = {
  piece: RoomPiece
  room: Room
  local: Matrix4
  farWall?: FarWall
  holdsHouseDoor?: boolean
}

export type RoomShowing = { startRoomFarDoor: boolean; endRoomGone: boolean }

export type FarWall = "door" | "full"

export const ROOM_PARTS: RoomPart[] = ROOMS.flatMap((room): RoomPart[] => [
  { piece: "safe_room_half", room, local: IDENTITY },
  { piece: "safe_room_half", room, local: HALF_TURN },
  {
    piece: "safe_room_doorway_wall",
    room,
    local: IDENTITY,
    holdsHouseDoor: true,
  },
  {
    piece: "safe_room_doorway_wall",
    room,
    local: HALF_TURN,
    farWall: room === "start" ? "door" : undefined,
  },
  ...(room === "start"
    ? [
        {
          piece: "safe_room_full_wall" as const,
          room,
          local: IDENTITY,
          farWall: "full" as const,
        },
      ]
    : []),
  { piece: "ceiling_lamp", room, local: IDENTITY },
])

export function roomBehind({ position: [x, y, z], rotationY }: DoorSpot): RoomSpot {
  return {
    position: [x - Math.sin(rotationY) * DOOR_LINE, y, z - Math.cos(rotationY) * DOOR_LINE],
    rotationY,
  }
}

export function roomMatrix(room: Room) {
  const { position, rotationY } = SAFE_ROOMS[room]
  return new Matrix4().compose(
    new Vector3(...position),
    new Quaternion().setFromAxisAngle(UP, rotationY),
    new Vector3(1, 1, 1),
  )
}

export function exteriorOf(room: Room) {
  return EXTERIOR_OF_ROOM[room]
}

export function roomOfDoorway(doorway: Doorway) {
  return ROOM_OF_DOORWAY[doorway]
}

export function doorFrameMatrix(doorway: Doorway) {
  const local = FAR_DOORWAYS.has(doorway)
    ? HALF_TURN.clone().multiply(NEAR_DOOR_FRAME)
    : NEAR_DOOR_FRAME
  return roomMatrix(roomOfDoorway(doorway)).multiply(local)
}

export function partShown(
  { room, farWall, holdsHouseDoor }: RoomPart,
  { startRoomFarDoor, endRoomGone }: RoomShowing,
) {
  if (room === "end" && endRoomGone && !holdsHouseDoor) return false
  if (!farWall) return true
  return (farWall === "door") === startRoomFarDoor
}

export function farDoorShown(doorway: Doorway, { startRoomFarDoor, endRoomGone }: RoomShowing) {
  if (doorway === "endFar") return !endRoomGone
  return doorway !== "startFar" || startRoomFarDoor
}

export function roomAxes(room: Room) {
  const { rotationY } = SAFE_ROOMS[room]
  return {
    inward: new Vector3(-Math.sin(rotationY), 0, -Math.cos(rotationY)),
    awayFromHinge: new Vector3(Math.cos(rotationY), 0, -Math.sin(rotationY)),
  }
}

export function wrapIntoStartRoom(from: Room) {
  const matrix = roomMatrix("start").multiply(HALF_TURN).multiply(roomMatrix(from).invert())
  const turn = SAFE_ROOMS.start.rotationY + HALF_TURN_ANGLE - SAFE_ROOMS[from].rotationY
  return { matrix, turn }
}
