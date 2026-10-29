import { RigidBody } from "@react-three/rapier"
import { Suspense } from "react"
import { CandleSets } from "@/candles/CandleSets"
import { ClockTable } from "@/clock/ClockTable"
import { Cockroaches } from "@/cockroaches/Cockroaches"
import { DoorWall, DoorWallLight } from "@/doorWall/DoorWall"
import { DOOR_WALL_INDEX, DOOR_WALL_SIDE, withoutPlacement } from "@/doorWall/doorWall"
import { Ghost } from "@/ghost/Ghost"
import { Paintings } from "@/paintings/Paintings"
import { Props } from "@/props/Props"
import { LampLight } from "@/safeRoom/LampLight"
import { SafeRoomColliders } from "@/safeRoom/SafeRoomColliders"
import { SafeRooms } from "@/safeRoom/SafeRooms"
import { Void } from "@/void/Void"
import { houseLayout, secondCorridorWall } from "./corridorLayout"
import { FIRST_CORRIDOR, SECOND_CORRIDOR } from "./house"
import { KitColliders } from "./KitColliders"
import { FloorTiles } from "./FloorTiles"
import { FLOOR_TILE_PIECES } from "./floorTiles"
import { KitInstances } from "./KitInstances"
import { KIT_URL } from "./kitPieces"
import { Underfloor } from "./Underfloor"
import { useKit } from "./useKit"
import { useKitSurfaceTuning } from "./useKitSurfaceTuning"
import { useKitUrl } from "./useKitUrl"

const HOUSE = houseLayout(FIRST_CORRIDOR, SECOND_CORRIDOR)

const DOOR_WALL = secondCorridorWall(
  FIRST_CORRIDOR,
  SECOND_CORRIDOR,
  DOOR_WALL_INDEX,
  DOOR_WALL_SIDE,
)

const PLACEMENTS = withoutPlacement(HOUSE, DOOR_WALL).filter(
  (placement) => !FLOOR_TILE_PIECES.has(placement.piece),
)

export function Corridor() {
  const url = useKitUrl()
  const kit = useKit(url)
  useKitSurfaceTuning()

  return (
    <>
      <KitInstances kit={kit} placements={PLACEMENTS} />
      <FloorTiles kit={kit} />
      <Underfloor />
      <Paintings kit={kit} first={FIRST_CORRIDOR} version={url.slice(KIT_URL.length)} />
      <Props kit={kit} first={FIRST_CORRIDOR} second={SECOND_CORRIDOR} />
      <CandleSets kit={kit} />
      <LampLight />
      <DoorWallLight wall={DOOR_WALL} />
      <Suspense fallback={null}>
        <SafeRooms kit={kit} />
        <ClockTable kit={kit} />
        <DoorWall kit={kit} wall={DOOR_WALL} />
        <Ghost />
        <Cockroaches kit={kit} />
      </Suspense>
      <RigidBody key={url} type="fixed" colliders={false}>
        <KitColliders kit={kit} placements={HOUSE} />
      </RigidBody>
      <SafeRoomColliders />
      <Void kit={kit} />
    </>
  )
}
