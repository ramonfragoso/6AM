import type { RefObject } from "react"
import { useCoordinatesReadout } from "./useCoordinatesReadout"
import { useDebugPlayerFlight } from "./useDebugPlayerFlight"

type DebugPlayerProps = { coordinatesReadout: RefObject<HTMLOutputElement | null> }

export function DebugPlayer({ coordinatesReadout }: DebugPlayerProps) {
  const { position, viewed } = useDebugPlayerFlight()
  useCoordinatesReadout(coordinatesReadout, position, viewed)
  return null
}
