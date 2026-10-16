import { useFrame } from "@react-three/fiber"
import { type RefObject, useEffect, useMemo } from "react"
import { Color, Matrix4, type PointLight, Vector3 } from "three"
import type { PieceModel } from "@/kit/useKit"
import { loopState } from "@/passage/loopState"
import { flickerWave } from "@/props/FlameLights"
import { LAMP_LIGHT_ANCHOR, type Room, ROOMS, roomMatrix } from "./safeRooms"
import type { CeilingLampSettings } from "./useSafeRoomTuning"
import { ceilingLampGlow } from "./useSafeRoomModel"

const LAMP_PHASE = 0.9

const OFF = 0

const lampLightSpots: { byRoom: Record<Room, Vector3> | null } = { byRoom: null }

export function useLampLight(light: RefObject<PointLight>, settings: CeilingLampSettings) {
  const color = useMemo(() => new Color(settings.color), [settings.color])

  useFrame(({ clock }) => {
    const spots = lampLightSpots.byRoom
    const wave = 1 + settings.flicker * flickerWave(clock.elapsedTime, LAMP_PHASE)
    const level = spots ? loopState.lampLevel * wave : OFF
    if (spots) light.current.position.copy(spots[loopState.lampRoom])
    light.current.intensity = settings.light * level
    ceilingLampGlow.value.copy(color).multiplyScalar(settings.glow * level)
  })
}

export function lampLightSpot() {
  return lampLightSpots.byRoom?.[loopState.lampRoom] ?? null
}

export function useLampLightSpots(lamp: PieceModel) {
  useEffect(() => {
    lampLightSpots.byRoom = lampLightPositions(lamp)
  }, [lamp])
}

function lampLightPositions(lamp: PieceModel): Record<Room, Vector3> {
  const anchor =
    lamp.anchors.find(({ name }) => name === LAMP_LIGHT_ANCHOR)?.matrix ?? new Matrix4()
  return Object.fromEntries(
    ROOMS.map((room) => [
      room,
      new Vector3().setFromMatrixPosition(roomMatrix(room).multiply(anchor)),
    ]),
  ) as Record<Room, Vector3>
}
