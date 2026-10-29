import { useFrame } from "@react-three/fiber"
import { type RefObject, useEffect } from "react"
import type { SpotLight } from "three"
import { listenForStaleShadows } from "@/props/FlameLights"
import type { VoidLightSettings } from "./voidLight"
import { voidOpen } from "./voidOpen"

const OFF = 0

export function useVoidLight(spotLight: RefObject<SpotLight>, settings: VoidLightSettings) {
  useEffect(() => {
    const refresh = () => {
      spotLight.current.shadow.needsUpdate = true
    }
    refresh()
    return listenForStaleShadows(refresh)
  }, [spotLight, settings])

  useFrame(() => {
    const intensity = voidOpen() ? settings.intensity : OFF
    if (spotLight.current.intensity !== intensity) spotLight.current.intensity = intensity
  })
}
