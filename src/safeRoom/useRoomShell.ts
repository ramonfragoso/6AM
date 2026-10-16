import { useFrame } from "@react-three/fiber"
import { useMemo } from "react"
import type { PieceModel } from "@/kit/useKit"
import { loopState } from "@/passage/loopState"
import { disposeInstances, instancesOf, type PartInstances, placeInstance } from "./partInstances"
import { useDisposeWhenDropped } from "./useDisposeWhenDropped"
import {
  type ExteriorPiece,
  exteriorOf,
  ROOM_PARTS,
  ROOM_PIECES,
  ROOMS,
  type RoomPart,
  type RoomPiece,
  roomMatrix,
  shownWith,
} from "./safeRooms"

type PlacedInstances = PartInstances & { placements: RoomPart[] }

type Shell = { instances: PlacedInstances[]; farDoorPlaced: boolean | null }

export function useRoomShell(room: Record<RoomPiece, PieceModel>) {
  const shell = useMemo<Shell>(
    () => ({
      instances: ROOM_PIECES.flatMap((piece) => {
        const placements = ROOM_PARTS.filter((placement) => placement.piece === piece)
        return instancesOf(room[piece].parts, placements.length).map((instances) => ({
          ...instances,
          placements,
        }))
      }),
      farDoorPlaced: null,
    }),
    [room],
  )

  useDisposeWhenDropped(shell, disposeShell)
  useFrame(() => {
    if (shell.farDoorPlaced === loopState.startRoomFarDoor) return
    shell.farDoorPlaced = loopState.startRoomFarDoor
    for (const instances of shell.instances) {
      instances.placements.forEach(({ room: placedIn, local, farWall }, index) => {
        const shown = shownWith(farWall, loopState.startRoomFarDoor)
        placeInstance(instances, index, shown ? roomMatrix(placedIn).multiply(local) : null)
      })
    }
  })

  return useMemo(() => shell.instances.map(({ mesh }) => mesh), [shell])
}

export function useExteriors(exterior: Record<ExteriorPiece, PieceModel>) {
  const instances = useMemo(
    () =>
      ROOMS.flatMap((room) =>
        instancesOf(exterior[exteriorOf(room)].parts, 1).map((placed) => {
          placeInstance(placed, 0, roomMatrix(room))
          return placed
        }),
      ),
    [exterior],
  )
  useDisposeWhenDropped(instances, disposeInstances)
  return useMemo(() => instances.map(({ mesh }) => mesh), [instances])
}

function disposeShell({ instances }: Shell) {
  disposeInstances(instances)
}
