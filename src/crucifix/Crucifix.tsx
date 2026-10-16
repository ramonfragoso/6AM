import { useRef } from "react"
import type { Group } from "three"
import type { DoorSpot } from "@/kit/corridorLayout"
import { useSurfacedModel } from "@/models/useSurfacedModel"
import type { Doorway } from "@/safeRoom/safeRooms"
import { CRUCIFIX_NODE, CRUCIFIX_URL, crucifixPlacement } from "./crucifix"
import { useCrucifixTuning } from "./useCrucifixTuning"
import { useHangOnDoor } from "./useHangOnDoor"

type CrucifixProps = { door: DoorSpot; doorway: Doorway }

export function Crucifix({ door, doorway }: CrucifixProps) {
  const crucifix = useSurfacedModel(CRUCIFIX_URL, CRUCIFIX_NODE)
  const spot = useCrucifixTuning()
  const group = useRef<Group>(null!)
  useHangOnDoor(group, crucifixPlacement(door, spot), doorway)

  return (
    <group ref={group} matrixAutoUpdate={false}>
      <primitive object={crucifix} />
    </group>
  )
}
