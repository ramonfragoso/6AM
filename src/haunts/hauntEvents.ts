import { eventChannel } from "@/events/eventChannel"
import type { Haunt } from "./haunts"

export type HauntEvent = { kind: "manifest"; haunt: Haunt }

export const hauntEvents = eventChannel<HauntEvent>()
