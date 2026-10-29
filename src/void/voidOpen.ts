import { hauntState } from "@/haunts/hauntState"
import type { Doorway, Room } from "@/safeRoom/safeRooms"

export const VOID_ROOM: Room = "end"

export const VOID_DOORWAY: Doorway = "endNear"

export function voidOpen() {
  return hauntState.voidDoor !== null
}

export function opensOntoVoid(doorway: Doorway) {
  return doorway === VOID_DOORWAY && voidOpen()
}
