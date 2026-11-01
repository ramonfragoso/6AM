import { type ReactNode, Suspense } from "react"
import { useCountedWhileWaiting } from "./useCountedWhileWaiting"

export function LoadingBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<StillLoading />}>{children}</Suspense>
}

function StillLoading() {
  useCountedWhileWaiting()
  return null
}
