import { useHelper } from "@react-three/drei"
import { useRef } from "react"
import { type PointLight, PointLightHelper } from "three"
import { useDebugMode } from "@/debug/useDebugMode"
import { lampShadowNode } from "./lampShadow"
import { useLampLight } from "./useLampLight"
import { useSafeRoomTuning } from "./useSafeRoomTuning"

const HELPER_SIZE = 0.1

export function LampLight() {
  const settings = useSafeRoomTuning()
  const light = useRef<PointLight>(null!)
  const debugMode = useDebugMode()
  useHelper(debugMode ? light : null, PointLightHelper, HELPER_SIZE, settings.color)
  useLampLight(light, settings)

  return (
    <pointLight
      ref={light}
      color={settings.color}
      distance={settings.distance}
      decay={settings.decay}
      castShadow
      shadow-shadowNode={lampShadowNode}
    />
  )
}
