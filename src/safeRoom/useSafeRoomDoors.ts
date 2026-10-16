import { useFrame } from "@react-three/fiber"
import { useMemo } from "react"
import { type Material, Matrix4, type MeshStandardMaterial } from "three"
import { DOOR_LEAF_NODE, DOOR_WALL_URL, doorLeafMatrix, framePartsOf } from "@/doorWall/doorWall"
import { kitSurfaceMaterial } from "@/kit/kitSurface"
import type { Kit, PiecePart } from "@/kit/useKit"
import { useSurfacedModel, type TexturesFor } from "@/models/useSurfacedModel"
import { loopState } from "@/passage/loopState"
import {
  disposeInstances,
  instancesOf,
  meshPartsOf,
  type PartInstances,
  placeInstance,
} from "./partInstances"
import { DOORWAYS, type Doorway, doorFrameMatrix, farDoorShown } from "./safeRooms"
import { useDisposeWhenDropped } from "./useDisposeWhenDropped"
import { ROOM_SURFACE } from "./useSafeRoomModel"

type PlacedDoors = { frames: PartInstances[]; leaves: PartInstances[]; placedAs: string[] }

const FRAME_MATRICES = Object.fromEntries(
  DOORWAYS.map((doorway) => [doorway, doorFrameMatrix(doorway)]),
) as Record<Doorway, Matrix4>

const leafMatrix = new Matrix4()

export function useSafeRoomDoors(kit: Kit, texturesFor: TexturesFor) {
  const frameParts = useRoomFrameParts(kit)
  const leaf = useSurfacedModel(DOOR_WALL_URL, DOOR_LEAF_NODE, texturesFor, ROOM_SURFACE)
  const doors = useMemo<PlacedDoors>(
    () => ({
      frames: instancesOf(frameParts, DOORWAYS.length),
      leaves: instancesOf(meshPartsOf(leaf), DOORWAYS.length),
      placedAs: [],
    }),
    [frameParts, leaf],
  )

  useDisposeWhenDropped(doors, disposeDoors)
  useFrame(() => DOORWAYS.forEach((doorway, index) => placeDoor(doors, doorway, index)))

  return useMemo(() => [...doors.frames, ...doors.leaves].map(({ mesh }) => mesh), [doors])
}

function placeDoor(doors: PlacedDoors, doorway: Doorway, index: number) {
  const shown = farDoorShown(doorway, loopState.startRoomFarDoor)
  const angle = loopState.leafAngles[doorway]
  const placedAs = shown ? String(angle) : ""
  if (doors.placedAs[index] === placedAs) return
  doors.placedAs[index] = placedAs
  const frame = shown ? FRAME_MATRICES[doorway] : null
  const leafAt = frame ? doorLeafMatrix(frame, angle, leafMatrix) : null
  doors.frames.forEach((instances) => placeInstance(instances, index, frame))
  doors.leaves.forEach((instances) => placeInstance(instances, index, leafAt))
}

function useRoomFrameParts(kit: Kit) {
  const parts = useMemo(() => {
    const surfaces = new Map<Material, Material>()
    return framePartsOf(kit).map((part): PiecePart => {
      const surface =
        surfaces.get(part.source) ??
        kitSurfaceMaterial(part.source as MeshStandardMaterial, ROOM_SURFACE)
      surfaces.set(part.source, surface)
      return { ...part, material: surface }
    })
  }, [kit])
  useDisposeWhenDropped(parts, disposeMaterials)
  return parts
}

function disposeDoors({ frames, leaves }: PlacedDoors) {
  disposeInstances([...frames, ...leaves])
}

function disposeMaterials(parts: PiecePart[]) {
  new Set(parts.map(({ material }) => material)).forEach((material) => material.dispose())
}
