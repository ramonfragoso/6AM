import type { Pose } from "@/passage/passage"

export const strangleView: { pose: Pose | null } = { pose: null }

export function strangling() {
  return strangleView.pose !== null
}
