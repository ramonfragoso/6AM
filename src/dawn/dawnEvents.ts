import { eventChannel } from "@/events/eventChannel"

export type DawnEvent = { kind: "playCredits"; from: number }

export const dawnEvents = eventChannel<DawnEvent>()
