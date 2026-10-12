import type { Placement } from "@/kit/kitPieces"
import { useSurfacedModel } from "@/models/useSurfacedModel"
import { CRUCIFIX_NODE, CRUCIFIX_URL, crucifixPlacement } from "./crucifix"
import { useCrucifixTuning } from "./useCrucifixTuning"

export function Crucifix({ door }: { door: Placement }) {
  const crucifix = useSurfacedModel(CRUCIFIX_URL, CRUCIFIX_NODE)
  const spot = useCrucifixTuning()
  const { position, rotationY, scale } = crucifixPlacement(door, spot)

  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <primitive object={crucifix} />
    </group>
  )
}
