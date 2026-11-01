import { useEffect } from "react"
import { preloadEndingMusic } from "./endingMusic"
import { useDawnTuning } from "./useDawnTuning"

export function Dawn() {
  useDawnTuning()
  useEffect(preloadEndingMusic, [])
  return null
}
