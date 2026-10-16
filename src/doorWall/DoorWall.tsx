import { useMemo } from "react"
import type { Matrix4 } from "three"
import { placementMatrix } from "@/kit/KitInstances"
import type { Placement } from "@/kit/kitPieces"
import type { Kit, PiecePart } from "@/kit/useKit"
import { useSurfacedModel } from "@/models/useSurfacedModel"
import { DoorLight } from "./DoorLight"
import {
  DOOR_LEAF_NODE,
  DOOR_WALL_NODE,
  DOOR_WALL_URL,
  doorFrameInWall,
  doorLeafMatrix,
  framePartsOf,
  kitTexturesOf,
} from "./doorWall"
import { useDoorWallTuning } from "./useDoorWallTuning"

export function DoorWallLight({ wall }: { wall: Placement }) {
  const { light } = useDoorWallTuning()
  const frame = useMemo(() => doorFrameInWall(wall), [wall])
  return <DoorLight frame={frame} settings={light} />
}

export function DoorWall({ kit, wall }: { kit: Kit; wall: Placement }) {
  const { open } = useDoorWallTuning()
  const texturesFor = useMemo(() => kitTexturesOf(kit), [kit])
  const holedWall = useSurfacedModel(DOOR_WALL_URL, DOOR_WALL_NODE, texturesFor)
  const leaf = useSurfacedModel(DOOR_WALL_URL, DOOR_LEAF_NODE, texturesFor)
  const frame = useMemo(() => doorFrameInWall(wall), [wall])
  const frameMatrix = useMemo(() => placementMatrix(frame), [frame])
  const leafMatrix = useMemo(() => doorLeafMatrix(frameMatrix, open), [frameMatrix, open])
  const frameParts = useMemo(() => framePartsOf(kit), [kit])

  return (
    <>
      <group position={wall.position} rotation-y={wall.rotationY}>
        <primitive object={holedWall} />
      </group>
      {frameParts.map((part, index) => (
        <PartMesh key={index} part={part} placement={frameMatrix} />
      ))}
      <group matrix={leafMatrix} matrixAutoUpdate={false}>
        <primitive object={leaf} />
      </group>
    </>
  )
}

function PartMesh({ part, placement }: { part: PiecePart; placement: Matrix4 }) {
  const matrix = useMemo(() => placement.clone().multiply(part.matrix), [placement, part])
  return (
    <mesh
      geometry={part.geometry}
      material={part.material}
      matrix={matrix}
      matrixAutoUpdate={false}
      castShadow
      receiveShadow
    />
  )
}
