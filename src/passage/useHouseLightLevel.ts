import { useFrame } from "@react-three/fiber"
import type { RefObject } from "react"
import type { Light } from "three"
import { hauntState } from "@/haunts/hauntState"
import { loopState } from "./loopState"

export function useHouseLightLevel(light: RefObject<Light>, intensity: number) {
  useFrame(() => {
    light.current.intensity = intensity * loopState.houseLevel * hauntState.houseLight
  })
}
