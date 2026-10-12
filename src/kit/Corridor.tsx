import { RigidBody } from "@react-three/rapier"
import { Suspense } from "react"
import { CandleSets } from "@/candles/CandleSets"
import { Crucifix } from "@/crucifix/Crucifix"
import { endDoorOf } from "@/crucifix/crucifix"
import { DoorWall } from "@/doorWall/DoorWall"
import { DOOR_WALL_INDEX, DOOR_WALL_SIDE, withoutPlacement } from "@/doorWall/doorWall"
import { Paintings } from "@/paintings/Paintings"
import { Props } from "@/props/Props"
import { houseLayout, secondCorridorWall } from "./corridorLayout"
import { corridorTokens, FIRST_CORRIDOR_LAYOUT, SECOND_CORRIDOR_LAYOUT } from "./corridorSpec"
import { KitColliders } from "./KitColliders"
import { KitInstances } from "./KitInstances"
import { KIT_URL } from "./kitPieces"
import { Underfloor } from "./Underfloor"
import { useKit } from "./useKit"
import { useKitSurfaceTuning } from "./useKitSurfaceTuning"
import { useKitUrl } from "./useKitUrl"

const FIRST_CORRIDOR = corridorTokens(FIRST_CORRIDOR_LAYOUT)

const SECOND_CORRIDOR = corridorTokens(SECOND_CORRIDOR_LAYOUT)

const HOUSE = houseLayout(FIRST_CORRIDOR, SECOND_CORRIDOR)

const DOOR_WALL = secondCorridorWall(
  FIRST_CORRIDOR,
  SECOND_CORRIDOR,
  DOOR_WALL_INDEX,
  DOOR_WALL_SIDE,
)

const PLACEMENTS = withoutPlacement(HOUSE, DOOR_WALL)

const END_DOOR = endDoorOf(PLACEMENTS)

export function Corridor() {
  const url = useKitUrl()
  const kit = useKit(url)
  useKitSurfaceTuning()

  return (
    <>
      <KitInstances kit={kit} placements={PLACEMENTS} />
      <Underfloor />
      <Paintings kit={kit} first={FIRST_CORRIDOR} version={url.slice(KIT_URL.length)} />
      <Props kit={kit} first={FIRST_CORRIDOR} second={SECOND_CORRIDOR} />
      <CandleSets kit={kit} />
      <Suspense fallback={null}>
        <Crucifix door={END_DOOR} />
        <DoorWall kit={kit} wall={DOOR_WALL} />
      </Suspense>
      <RigidBody key={url} type="fixed" colliders={false}>
        <KitColliders kit={kit} placements={HOUSE} />
      </RigidBody>
    </>
  )
}
