import type { RapierRigidBody } from "@react-three/rapier"
import { useRef } from "react"
import type { Object3D } from "three"
import type { Kit } from "@/kit/useKit"
import { DarknessAroundDoor } from "./DarknessAroundDoor"
import { useLeafCollider } from "./useLeafCollider"
import { useVoidDoor } from "./useVoidDoor"
import { useVoidFall } from "./useVoidFall"
import { useVoidPieces } from "./useVoidPieces"
import { useVoidPresence } from "./useVoidPresence"
import { useVoidTuning } from "./useVoidTuning"
import { useVoidVolume } from "./useVoidVolume"
import { VoidColliders } from "./VoidColliders"
import { VoidLight } from "./VoidLight"
import { CREAK_SPOT } from "./voidSpace"

export function Void({ kit }: { kit: Kit }) {
  const sound = useVoidTuning()
  const creakSpot = useRef<Object3D>(null)
  const leaf = useRef<RapierRigidBody>(null)
  const pieces = useVoidPieces(kit)
  useVoidDoor(creakSpot, sound)
  useLeafCollider(leaf)
  useVoidVolume()
  useVoidPresence()
  useVoidFall()

  return (
    <>
      {pieces.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
      <object3D ref={creakSpot} position={CREAK_SPOT} />
      <VoidColliders kit={kit} leaf={leaf} />
      <VoidLight />
      <DarknessAroundDoor />
    </>
  )
}
