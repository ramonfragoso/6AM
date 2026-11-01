import { useLayoutEffect } from "react"
import { loading } from "./loading"

export function useCountedWhileWaiting() {
  useLayoutEffect(() => {
    loading.waitingBoundaries += 1
    return () => {
      loading.waitingBoundaries -= 1
    }
  }, [])
}
