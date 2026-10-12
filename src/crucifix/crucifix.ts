import type { Vector3Tuple } from "three"
import type { Placement } from "@/kit/kitPieces"

export const CRUCIFIX_URL = "/models/crucifix.glb"

export const CRUCIFIX_NODE = "kit_crucifix"

export const BLENDER_HEIGHT = 2.1833

const DOOR_FACE_OFFSET = 0.11

export type CrucifixSpot = { height: number; size: number }

export type CrucifixPlacement = {
  position: Vector3Tuple
  rotationY: number
  scale: number
}

export function endDoorOf(placements: Placement[]): Placement {
  const door = placements.filter(({ piece }) => piece === "door").at(-1)
  if (!door) throw new Error("The House has no door to hang the Crucifix on")
  return door
}

export function crucifixPlacement(
  { position: [x, , z], rotationY }: Placement,
  { height, size }: CrucifixSpot,
): CrucifixPlacement {
  return {
    position: [
      x + DOOR_FACE_OFFSET * Math.sin(rotationY),
      height,
      z + DOOR_FACE_OFFSET * Math.cos(rotationY),
    ],
    rotationY,
    scale: size,
  }
}
