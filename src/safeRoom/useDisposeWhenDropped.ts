import { useEffect } from "react"

const pendingDisposals = new Map<unknown, ReturnType<typeof setTimeout>>()

export function useDisposeWhenDropped<Value>(value: Value, dispose: (value: Value) => void) {
  useEffect(() => {
    clearTimeout(pendingDisposals.get(value))
    pendingDisposals.delete(value)
    return () => {
      const disposal = setTimeout(() => {
        pendingDisposals.delete(value)
        dispose(value)
      })
      pendingDisposals.set(value, disposal)
    }
  }, [value, dispose])
}
