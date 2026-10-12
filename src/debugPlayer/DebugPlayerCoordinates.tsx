import type { Ref } from "react"

type DebugPlayerCoordinatesProps = { ref: Ref<HTMLOutputElement> }

export function DebugPlayerCoordinates({ ref }: DebugPlayerCoordinatesProps) {
  return (
    <output
      ref={ref}
      hidden
      aria-label="DebugPlayer coordinates"
      className="pointer-events-none absolute right-2 bottom-2 z-50 rounded bg-black/60 px-2 py-1 font-mono text-xs whitespace-pre text-white"
    />
  )
}
