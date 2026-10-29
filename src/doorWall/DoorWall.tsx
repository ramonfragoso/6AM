import { useEffect, useMemo, useRef } from "react"
import type { Group, Matrix4, Object3D } from "three"
import { BackSide } from "three/webgpu"
import { placementMatrix } from "@/kit/KitInstances"
import type { Placement } from "@/kit/kitPieces"
import type { Kit, PiecePart } from "@/kit/useKit"
import { useSurfacedModel } from "@/models/useSurfacedModel"
import { DoorLight } from "./DoorLight"
import {
  DOOR_LEAF_NODE,
  DOOR_WALL_NODE,
  DOOR_WALL_URL,
  castNoShadows,
  doorFrameInWall,
  DOORWAY_DARKNESS_SIZE,
  doorwayDarknessMatrix,
  doorwayMiddle,
  framePartsOf,
  kitTexturesOf,
} from "./doorWall"
import { useDoorLeaf } from "./useDoorLeaf"

const DARKNESS_COLOR = "#000000"
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
  const frameParts = useMemo(() => framePartsOf(kit), [kit])
  const leafGroup = useRef<Group>(null)
  const slamSpot = useRef<Object3D>(null)
  useEffect(() => castNoShadows(leaf), [leaf])
  useDoorLeaf(leafGroup, slamSpot, frameMatrix, open)

  return (
    <>
      <group position={wall.position} rotation-y={wall.rotationY}>
        <primitive object={holedWall} />
      </group>
      {frameParts.map((part, index) => (
        <PartMesh key={index} part={part} placement={frameMatrix} />
      ))}
      <group ref={leafGroup} matrixAutoUpdate={false}>
        <primitive object={leaf} />
      </group>
      <object3D ref={slamSpot} position={doorwayMiddle(frame)} />
      <DoorwayDarkness frame={frameMatrix} />
    </>
  )
}

function DoorwayDarkness({ frame }: { frame: Matrix4 }) {
  const matrix = useMemo(() => doorwayDarknessMatrix(frame), [frame])
  return (
    <mesh matrix={matrix} matrixAutoUpdate={false}>
      <boxGeometry args={DOORWAY_DARKNESS_SIZE} />
      <meshBasicMaterial color={DARKNESS_COLOR} side={BackSide} />
    </mesh>
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
