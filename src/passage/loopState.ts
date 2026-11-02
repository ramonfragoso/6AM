import type { Doorway, Room } from "@/safeRoom/safeRooms"

export type Whereabouts = "startRoom" | "house"

export const loopState = {
  whereabouts: "startRoom" as Whereabouts,
  passing: false,
  startRoomFarDoor: false,
  leafAngles: {
    startNear: 0,
    startFar: 0,
    endNear: 0,
    endFar: 0,
  } as Record<Doorway, number>,
  lampRoom: "start" as Room,
  lampLevel: 1,
  houseLevel: 0,
}
