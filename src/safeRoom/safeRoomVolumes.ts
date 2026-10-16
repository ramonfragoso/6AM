import { float, Fn, max, min, uniform, vec2, vec3, vec4 } from "three/tsl"
import type { Node } from "three/webgpu"
import { DOOR_LINE, ROOM_HALF_WIDTH, ROOM_HEIGHT, ROOMS, roomMatrix } from "./safeRooms"

const ROOM_MIN = vec3(-ROOM_HALF_WIDTH, 0, -DOOR_LINE)

const ROOM_MAX = vec3(ROOM_HALF_WIDTH, ROOM_HEIGHT, DOOR_LINE)

const SMALLEST_DIRECTION = 1e-5

const intoRooms = ROOMS.map((room) => uniform(roomMatrix(room).invert()))

const awayFromZero = Fn(([value]: [Node<"float">]) =>
  value.greaterThanEqual(0).select(value.max(SMALLEST_DIRECTION), value.min(-SMALLEST_DIRECTION)),
)

const roomSpans = intoRooms.map((intoRoom) =>
  Fn(([origin, direction]: [Node<"vec3">, Node<"vec3">]) => {
    const start = intoRoom.mul(vec4(origin, 1)).xyz.toVar()
    const heading = intoRoom.mul(vec4(direction, 0)).xyz.toVar()
    const inverse = vec3(1)
      .div(vec3(awayFromZero(heading.x), awayFromZero(heading.y), awayFromZero(heading.z)))
      .toVar()
    const toMin = ROOM_MIN.sub(start).mul(inverse).toVar()
    const toMax = ROOM_MAX.sub(start).mul(inverse).toVar()
    const nearest = min(toMin, toMax).toVar()
    const farthest = max(toMin, toMax).toVar()
    return vec2(
      max(max(nearest.x, nearest.y), nearest.z),
      min(min(farthest.x, farthest.y), farthest.z),
    )
  }),
)

const insideRooms = intoRooms.map((intoRoom) =>
  Fn(([position]: [Node<"vec3">]) => {
    const local = intoRoom.mul(vec4(position, 1)).xyz.toVar()
    const above = local.greaterThanEqual(ROOM_MIN).all()
    const below = local.lessThanEqual(ROOM_MAX).all()
    return above.and(below).select(float(1), float(0))
  }),
)

export function safeRoomSpans(origin: Node<"vec3">, direction: Node<"vec3">) {
  return roomSpans.map((span) => span(origin, direction).toVar())
}

export function insideSpans(spans: Node<"vec2">[], travelled: Node<"float">) {
  return spans.reduce<Node<"float">>(
    (inside, span) =>
      max(
        inside,
        travelled.greaterThanEqual(span.x).and(travelled.lessThanEqual(span.y)).select(1, 0),
      ),
    float(0),
  )
}

export function lengthInSpans(spans: Node<"vec2">[], length: Node<"float">) {
  return spans.reduce<Node<"float">>(
    (total, span) => total.add(min(span.y, length).sub(max(span.x, 0)).max(0)),
    float(0),
  )
}

export function outsideSafeRooms(position: Node<"vec3">) {
  return float(1).sub(
    insideRooms.reduce<Node<"float">>((inside, room) => max(inside, room(position)), float(0)),
  )
}
