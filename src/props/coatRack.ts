import type { FurnitureSpot } from "./propPlacements"

export const COAT_RACK_URL = "/models/coat_rack.glb"

export const COAT_RACK_NODE = "kit_coat_rack"

export const COAT_RACK_SPOT: FurnitureSpot = {
  x: 8.5,
  z: 14.4,
  turn: 0,
  size: 1,
}

const POLE_RADIUS = 0.31

const POLE_HEIGHT = 2.608

const DEGREES = Math.PI / 180

export type CoatRackPlacement = {
  position: [x: number, y: number, z: number]
  rotationY: number
  scale: number
}

export function coatRackPlacement({ x, z, turn, size }: FurnitureSpot): CoatRackPlacement {
  return { position: [x, 0, z], rotationY: turn * DEGREES, scale: size }
}

export function coatRackCollider({ position: [x, , z], scale }: CoatRackPlacement) {
  const halfHeight = (POLE_HEIGHT * scale) / 2
  return {
    args: [halfHeight, POLE_RADIUS * scale] as [halfHeight: number, radius: number],
    position: [x, halfHeight, z] as [x: number, y: number, z: number],
  }
}
