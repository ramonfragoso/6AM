import { RigidBody } from "@react-three/rapier"
import { Suspense, useMemo } from "react"
import type { CorridorToken } from "@/kit/corridorSpec"
import { KitColliders } from "@/kit/KitColliders"
import { KitInstances } from "@/kit/KitInstances"
import type { Placement } from "@/kit/kitPieces"
import type { Kit } from "@/kit/useKit"
import { CoatRack } from "./CoatRack"
import { Fires } from "./Fires"
import { FlameLights } from "./FlameLights"
import { flamesByGroup } from "./flames"
import {
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
  const furniture = useMemo(
    () => [
      furniturePlacement("square_table_set", squareTable),
      furniturePlacement("round_table_set", roundTable),
      furniturePlacement("chair", chair),
    ],
    [squareTable, roundTable, chair],
  )
  const lanterns = useMemo(() => lanternPlacements(first, lanternHeight), [first, lanternHeight])
  const tiledLanternAt = useMemo(
    () => tiledLanternPlacement(tiledLantern, lanternHeight),
    [tiledLantern, lanternHeight],
  )
  const placements = useMemo(
    () => [...furniture, ...lanterns, tiledLanternAt],
    [furniture, lanterns, tiledLanternAt],
  )
  const flames = useMemo(
    () => flamesByGroup(kit, [...furniture, ...lanterns], { tiledLantern: [tiledLanternAt] }),
    [kit, furniture, lanterns, tiledLanternAt],
  )

  return (
    <>
      <KitInstances kit={kit} placements={placements} />
      {furniture.map((placement) => (
        <RigidBody key={colliderKey(placement)} type="fixed" colliders={false}>
          <KitColliders kit={kit} placements={[placement]} />
        </RigidBody>
      ))}
      <Suspense fallback={null}>
        <CoatRack spot={coatRack} />
      </Suspense>
      <FlameLights flames={flames} settings={flameSettings} />
      <Suspense fallback={null}>
        <Fires flames={flames} settings={flameSettings} />
      </Suspense>
    </>
  )
}

function colliderKey(placement: Placement) {
  return JSON.stringify(placement)
}
