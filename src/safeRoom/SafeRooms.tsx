import { useEffect, useMemo } from "react"
import { Crucifix } from "@/crucifix/Crucifix"
import { kitTexturesOf } from "@/doorWall/doorWall"
import { HOUSE_DOORS } from "@/kit/house"
import type { Kit } from "@/kit/useKit"
import { refreshStaticShadows } from "@/props/FlameLights"
import { useLampLightSpots } from "./useLampLight"
import { useExteriors, useRoomShell } from "./useRoomShell"
import { useSafeRoomDoors } from "./useSafeRoomDoors"
import { useSafeRoomModel } from "./useSafeRoomModel"

export function SafeRooms({ kit }: { kit: Kit }) {
  const texturesFor = useMemo(() => kitTexturesOf(kit), [kit])
  const { room, exterior } = useSafeRoomModel(texturesFor)
  const shell = useRoomShell(room)
  const exteriors = useExteriors(exterior)
  const doors = useSafeRoomDoors(kit, texturesFor)
  useLampLightSpots(room.ceiling_lamp)
  useEffect(refreshStaticShadows, [shell, exteriors, doors])

  return (
    <>
      {[...shell, ...exteriors, ...doors].map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
      <Crucifix door={HOUSE_DOORS.end} doorway="endNear" />
    </>
  )
}
