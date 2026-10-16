import { eventChannel } from "@/events/eventChannel"
import type { Way } from "./loops"

export type NightEvent =
  { kind: "verdict"; passed: boolean; way: Way } | { kind: "dawn" } | { kind: "newNight" }

export const nightEvents = eventChannel<NightEvent>()
