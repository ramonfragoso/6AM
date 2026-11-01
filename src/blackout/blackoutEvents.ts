import { eventChannel } from "@/events/eventChannel"

export type BlackoutEvent = { kind: "fadeOut" | "fadeIn"; seconds: number }

export const blackoutEvents = eventChannel<BlackoutEvent>()
