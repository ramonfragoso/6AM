import { eventChannel } from "@/events/eventChannel"

export type StepEvent = { kind: "step" }

export const stepEvents = eventChannel<StepEvent>()

export function emitStep() {
  stepEvents.emit({ kind: "step" })
}
