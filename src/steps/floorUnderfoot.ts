import type { Vector3 } from "three"
import { SECOND_CORRIDOR_START_Z } from "@/kit/corridorLayout"
import { loopState } from "@/passage/loopState"

export type FloorKind = "wood" | "tiles"

export function floorUnderfoot(eye: Vector3): FloorKind {
  if (loopState.whereabouts === "startRoom") return "tiles"
  return eye.z > SECOND_CORRIDOR_START_Z ? "tiles" : "wood"
}
