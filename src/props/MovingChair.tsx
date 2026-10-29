import { RigidBody } from "@react-three/rapier"
import { useMemo, useRef } from "react"
import type { Group, Object3D } from "three"
import { KitColliders } from "@/kit/KitColliders"
import { KitInstances } from "@/kit/KitInstances"
import type { Kit } from "@/kit/useKit"
import { type FurnitureSpot, furniturePlacement } from "./propPlacements"
import { useChairMove } from "./useChairMove"

const SOUND_HEIGHT = 0.5

export function MovingChair({ kit, spot }: { kit: Kit; spot: FurnitureSpot }) {
  const chair = useRef<Group>(null)
  const soundSpot = useRef<Object3D>(null)
  const standing = useChairMove(chair, soundSpot, spot)
  const placements = useMemo(() => [furniturePlacement("chair", spot)], [spot])
  const collider = useMemo(() => furniturePlacement("chair", standing), [standing])

  return (
    <>
      <group ref={chair} matrixAutoUpdate={false}>
        <KitInstances kit={kit} placements={placements} />
        <object3D ref={soundSpot} position={[spot.x, SOUND_HEIGHT, spot.z]} />
      </group>
      <RigidBody key={JSON.stringify(collider)} type="fixed" colliders={false}>
        <KitColliders kit={kit} placements={[collider]} />
      </RigidBody>
    </>
  )
}
