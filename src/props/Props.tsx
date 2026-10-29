import { RigidBody } from "@react-three/rapier"
import { Suspense, useMemo } from "react"
import { Vector3 } from "three"
import type { CorridorToken } from "@/kit/corridorSpec"
import { KitColliders } from "@/kit/KitColliders"
import { KitInstances } from "@/kit/KitInstances"
import type { Placement } from "@/kit/kitPieces"
import { usePlacedPieces } from "@/kit/placedPieces"
import type { Kit } from "@/kit/useKit"
import { Clutter } from "./Clutter"
import type { Obstacle } from "./clutter"
import { CoatRack } from "./CoatRack"
import { coatRackObstacle } from "./coatRack"
import { Fires } from "./Fires"
import { FlameLights } from "./FlameLights"
import { FireSounds } from "./FireSounds"
import { fireSoundSpots, flamesByGroup } from "./flames"
import { MovingChair } from "./MovingChair"
import {
  type FurnitureSpot,
  furniturePlacement,
  lanternPlacements,
  tiledLanternPlacement,
  tiledLanternSpot,
} from "./propPlacements"
import { useFlamesTuning } from "./useFlamesTuning"
import { usePropsTuning } from "./usePropsTuning"

type PropsProps = { kit: Kit; first: CorridorToken[]; second: CorridorToken[] }

export function Props({ kit, first, second }: PropsProps) {
  const tiledLanternDefaults = useMemo(() => tiledLanternSpot(first, second), [first, second])
  const { squareTable, roundTable, chair, coatRack, tiledLantern, lanternHeight } =
    usePropsTuning(tiledLanternDefaults)
  const flameSettings = useFlamesTuning()
  const tables = useMemo(
    () => [
      furniturePlacement("square_table_set", squareTable),
      furniturePlacement("round_table_set", roundTable),
    ],
    [squareTable, roundTable],
  )
  const furniture = useMemo(() => [...tables, furniturePlacement("chair", chair)], [tables, chair])
  usePlacedPieces("furniture", furniture)
  const lanterns = useMemo(() => lanternPlacements(first, lanternHeight), [first, lanternHeight])
  const tiledLanternAt = useMemo(
    () => tiledLanternPlacement(tiledLantern, lanternHeight),
    [tiledLantern, lanternHeight],
  )
  const placements = useMemo(
    () => [...tables, ...lanterns, tiledLanternAt],
    [tables, lanterns, tiledLanternAt],
  )
  const flames = useMemo(
    () => flamesByGroup(kit, [...furniture, ...lanterns], { tiledLantern: [tiledLanternAt] }),
    [kit, furniture, lanterns, tiledLanternAt],
  )
  const clutterObstacles = useMemo(
    () => furnitureObstacles(kit, furniture, coatRack),
    [kit, furniture, coatRack],
  )
  const fireSounds = useMemo(
    () => fireSoundSpots(kit, [...furniture, ...lanterns], tiledLanternAt),
    [kit, furniture, lanterns, tiledLanternAt],
  )

  return (
    <>
      <KitInstances kit={kit} placements={placements} />
      {tables.map((placement) => (
        <RigidBody key={colliderKey(placement)} type="fixed" colliders={false}>
          <KitColliders kit={kit} placements={[placement]} />
        </RigidBody>
      ))}
      <MovingChair kit={kit} spot={chair} />
      <Suspense fallback={null}>
        <CoatRack spot={coatRack} />
      </Suspense>
      <Clutter kit={kit} obstacles={clutterObstacles} />
      <FlameLights flames={flames} settings={flameSettings} />
      <FireSounds spots={fireSounds} />
      <Suspense fallback={null}>
        <Fires flames={flames} settings={flameSettings} />
      </Suspense>
    </>
  )
}

function furnitureObstacles(kit: Kit, furniture: Placement[], coatRack: FurnitureSpot): Obstacle[] {
  const pieces = furniture.map(({ piece, position: [x, , z], scale = 1 }) => {
    const size = kit[piece].bounds.getSize(new Vector3())
    return { x, z, radius: (Math.hypot(size.x, size.z) / 2) * scale }
  })
  return [...pieces, coatRackObstacle(coatRack)]
}

function colliderKey(placement: Placement) {
  return JSON.stringify(placement)
}
