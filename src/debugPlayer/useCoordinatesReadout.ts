import { useFrame } from "@react-three/fiber"
import { useEffect, type RefObject } from "react"
import type { Vector3 } from "three"

const DECIMALS = 2

export function useCoordinatesReadout(
  readout: RefObject<HTMLOutputElement | null>,
  position: Vector3,
  shown: boolean,
) {
  useEffect(() => {
    if (readout.current) readout.current.hidden = !shown
  }, [readout, shown])

  useFrame(() => {
    if (!shown || !readout.current) return
    const text = formatCoordinates(position)
    if (readout.current.textContent !== text) readout.current.textContent = text
  })
}

function formatCoordinates({ x, y, z }: Vector3) {
  return `x ${x.toFixed(DECIMALS)}  y ${y.toFixed(DECIMALS)}  z ${z.toFixed(DECIMALS)}`
}
