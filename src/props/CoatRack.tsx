import { CylinderCollider, RigidBody } from "@react-three/rapier"
import { useMemo } from "react"
import { useSurfacedModel } from "@/models/useSurfacedModel"
import { COAT_RACK_NODE, COAT_RACK_URL, coatRackCollider, coatRackPlacement } from "./coatRack"
import type { FurnitureSpot } from "./propPlacements"

export function CoatRack({ spot }: { spot: FurnitureSpot }) {
  const coatRack = useSurfacedModel(COAT_RACK_URL, COAT_RACK_NODE)
  const placement = useMemo(() => coatRackPlacement(spot), [spot])
  const { args, position } = coatRackCollider(placement)

  return (
    <>
      <group position={placement.position} rotation-y={placement.rotationY} scale={placement.scale}>
        <primitive object={coatRack} />
      </group>
      <RigidBody key={JSON.stringify(placement)} type="fixed" colliders={false}>
        <CylinderCollider args={args} position={position} />
      </RigidBody>
    </>
  )
}
