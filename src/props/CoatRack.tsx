import { CylinderCollider, RigidBody } from "@react-three/rapier"
import { useEffect, useMemo } from "react"
import { useSurfacedModel } from "@/models/useSurfacedModel"
import {
  COAT_RACK_NODE,
  COAT_RACK_URL,
  coatRackCollider,
  coatRackPlacement,
  placedCoatRack,
} from "./coatRack"
import type { FurnitureSpot } from "./propPlacements"
import { useBareCoatRack } from "./useBareCoatRack"

export function CoatRack({ spot }: { spot: FurnitureSpot }) {
  const coatRack = useSurfacedModel(COAT_RACK_URL, COAT_RACK_NODE)
  useBareCoatRack(coatRack)
  useEffect(() => void Object.assign(placedCoatRack, spot), [spot])
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
