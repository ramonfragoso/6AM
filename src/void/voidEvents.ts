import { eventChannel } from "@/events/eventChannel"

export type VoidEvent = { kind: "fadeOut" | "fadeIn"; seconds: number }

export const voidEvents = eventChannel<VoidEvent>()
