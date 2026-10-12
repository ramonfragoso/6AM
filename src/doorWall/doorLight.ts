import type { Vector3Tuple } from "three"
import type { Placement } from "@/kit/kitPieces"

const DEGREES = Math.PI / 180

export type DoorLightSettings = {
  intensity: number
  color: string
  out: number
  along: number
  height: number
  aimHeight: number
  angle: number
  penumbra: number
  distance: number
  decay: number
}

export type DoorLightAim = { position: Vector3Tuple; target: Vector3Tuple; angle: number }

export function doorLightAim(
  { position: [x, , z], rotationY }: Placement,
  { out, along, height, aimHeight, angle }: DoorLightSettings,
): DoorLightAim {
  const alongX = Math.cos(rotationY)
  const alongZ = -Math.sin(rotationY)
  const towardCorridorX = -Math.sin(rotationY)
  const towardCorridorZ = -Math.cos(rotationY)
  return {
    position: [
      x + towardCorridorX * out + alongX * along,
      height,
      z + towardCorridorZ * out + alongZ * along,
    ],
    target: [x, aimHeight, z],
    angle: angle * DEGREES,
  }
}
