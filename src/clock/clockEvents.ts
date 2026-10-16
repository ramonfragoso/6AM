import type { Hand } from "./clock"

export type ClockEvent =
  | { kind: "tick"; second: number }
  | { kind: "stall" }
  | { kind: "glitchStart" }
  | { kind: "glitchStep"; hand: Exclude<Hand, "hour"> }
  | { kind: "reset" }
  | { kind: "ring" }

type Listener = (event: ClockEvent) => void

const listeners = new Set<Listener>()

export const clockEvents = {
  emit(event: ClockEvent) {
    for (const listener of listeners) listener(event)
  },
  listen(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
