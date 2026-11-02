import { useFrame } from "@react-three/fiber"
import type { RefObject } from "react"
import { readGamepad } from "./gamepad"
import { useLastInputDevice } from "./useLastInputDevice"

export function useDeviceData(element: RefObject<HTMLElement | null>) {
  const readDevice = useLastInputDevice()

  useFrame(() => {
    const target = element.current
    if (!target) return
    const device = readDevice(readGamepad())
    if (target.dataset.device !== device) target.dataset.device = device
  })
}
