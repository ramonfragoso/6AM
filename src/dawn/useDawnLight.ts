import { useFrame } from "@react-three/fiber"
import { type RefObject, useEffect, useRef } from "react"
import { Color, type Group, type Mesh, type SpotLight } from "three"
import type { MeshBasicNodeMaterial } from "three/webgpu"
import { type Room, roomMatrix } from "@/safeRoom/safeRooms"
import { dawnLight, lightFilledRoom } from "./dawnLight"
import type { DawnLightSettings } from "./dawnLightSettings"

export type DawnLightParts = {
  room: RefObject<Group>
  box: RefObject<Mesh>
  glow: RefObject<MeshBasicNodeMaterial>
  spotLight: RefObject<SpotLight>
}

const RESTING_ROOM: Room = "end"

const SHOWN = 1

const HIDDEN = 0

const OFF = 0

export function useDawnLight(
  { room, box, glow, spotLight }: DawnLightParts,
  { intensity, color, glow: brightness }: DawnLightSettings,
) {
  const placedIn = useRef<Room | null | undefined>(undefined)

  useEffect(() => {
    glow.current.color.copy(new Color(color)).multiplyScalar(brightness)
  }, [glow, color, brightness])

  useFrame(() => {
    const filled = lightFilledRoom()
    if (placedIn.current !== filled) {
      placedIn.current = filled
      room.current.matrix.copy(roomMatrix(filled ?? RESTING_ROOM))
      room.current.matrixWorldNeedsUpdate = true
      box.current.scale.setScalar(filled ? SHOWN : HIDDEN)
    }
    const level = filled ? intensity * dawnLight.opened : OFF
    if (spotLight.current.intensity !== level) spotLight.current.intensity = level
  })
}
