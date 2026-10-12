import { CuboidCollider } from "@react-three/rapier"
import { Box3, Vector3, type Vector3Tuple } from "three"
import { placementMatrix } from "./KitInstances"
import { isSolid, type KitPiece, type Placement } from "./kitPieces"
import type { Kit } from "./useKit"

const DOORWAY_HALF_WIDTH = 0.73

const DOORWAY_HEIGHT = 2.8

const UNIT_SCALE = 1

export function KitColliders({ kit, placements }: { kit: Kit; placements: Placement[] }) {
  return placements
    .filter((placement) => isSolid(placement.piece) && !kit[placement.piece].bounds.isEmpty())
    .flatMap((placement, index) =>
      collisionBoxes(placement.piece, kit[placement.piece].bounds).map((box, part) => (
        <BoxCollider key={`${index}-${part}`} box={box} placement={placement} />
      )),
    )
}

function collisionBoxes(piece: KitPiece, bounds: Box3) {
  if (piece !== "door_frame") return [bounds]
  const { min, max } = bounds
  return [
    new Box3(min.clone(), new Vector3(-DOORWAY_HALF_WIDTH, max.y, max.z)),
    new Box3(new Vector3(DOORWAY_HALF_WIDTH, min.y, min.z), max.clone()),
    new Box3(
      new Vector3(-DOORWAY_HALF_WIDTH, DOORWAY_HEIGHT, min.z),
      new Vector3(DOORWAY_HALF_WIDTH, max.y, max.z),
    ),
  ]
}

function BoxCollider({ box, placement }: { box: Box3; placement: Placement }) {
  const size = box.getSize(new Vector3()).multiplyScalar(placement.scale ?? UNIT_SCALE)
  const center = box.getCenter(new Vector3()).applyMatrix4(placementMatrix(placement))
  const halfExtents: Vector3Tuple = [size.x / 2, size.y / 2, size.z / 2]

  return (
    <CuboidCollider
      args={halfExtents}
      position={center.toArray()}
      rotation={[0, placement.rotationY, 0]}
    />
  )
}
