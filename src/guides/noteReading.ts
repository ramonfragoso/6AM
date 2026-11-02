import { MathUtils, Vector3 } from "three"
import { forwardOf } from "@/passage/passage"
import type { Note } from "./guides"

export type ReadingReach = { reach: number; facing: number }

export const noteReading = {
  aimed: null as Note | null,
  open: null as Note | null,
  fronts: { guide: null, hauntCount: null } as Record<Note, Vector3 | null>,
  facings: { guide: new Vector3(), hauntCount: new Vector3() } as Record<Note, Vector3>,
}

export function reading() {
  return noteReading.open !== null
}

export function closeReading() {
  noteReading.open = null
}

export function aimedNote(eye: Vector3, yaw: number, { reach, facing }: ReadingReach) {
  const forward = forwardOf(yaw)
  const limit = MathUtils.degToRad(facing)
  let best: Note | null = null
  let bestAngle = limit
  for (const [note, front] of Object.entries(noteReading.fronts) as [Note, Vector3 | null][]) {
    if (!front) continue
    const toNote = front.clone().sub(eye).setY(0)
    if (toNote.length() > reach || toNote.dot(noteReading.facings[note]) >= 0) continue
    const angle = forward.angleTo(toNote)
    if (angle > bestAngle) continue
    best = note
    bestAngle = angle
  }
  return best
}
