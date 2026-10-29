import { useFrame } from "@react-three/fiber"
import { useMemo } from "react"
import type { PieceModel } from "@/kit/useKit"
import { loopState } from "@/passage/loopState"
import { voidOpen } from "@/void/voidOpen"
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
  type RoomShowing,
  partShown,
  roomMatrix,
} from "./safeRooms"

type PlacedInstances = PartInstances & { placements: RoomPart[] }

type Shell = { instances: PlacedInstances[]; placedAs: string | null }

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
      placedAs: null,
    }),
    [room],
  )

  useDisposeWhenDropped(shell, disposeShell)
  useFrame(() => {
    const showing = roomShowing()
    const placedAs = showingKey(showing)
    if (shell.placedAs === placedAs) return
    shell.placedAs = placedAs
    for (const instances of shell.instances) {
      instances.placements.forEach((part, index) => {
        const shown = partShown(part, showing)
        placeInstance(instances, index, shown ? roomMatrix(part.room).multiply(part.local) : null)
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

export function roomShowing(): RoomShowing {
  return { startRoomFarDoor: loopState.startRoomFarDoor, endRoomGone: voidOpen() }
}

function showingKey({ startRoomFarDoor, endRoomGone }: RoomShowing) {
  return `${startRoomFarDoor} ${endRoomGone}`
}

function disposeShell({ instances }: Shell) {
  disposeInstances(instances)
}
