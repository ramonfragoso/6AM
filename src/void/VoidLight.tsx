import { useHelper } from "@react-three/drei"
import { useMemo, useRef } from "react"
import { Object3D, type SpotLight, SpotLightHelper } from "three"
import { useDebugMode } from "@/debug/useDebugMode"
import { useVoidLight } from "./useVoidLight"
import { useVoidLightTuning } from "./useVoidLightTuning"
import { voidLightAim } from "./voidLight"

const VOID_SHADOW = {
  "shadow-mapSize-width": 1024,
  "shadow-mapSize-height": 1024,
  "shadow-camera-near": 0.1,
  "shadow-bias": -0.0005,
  "shadow-normalBias": 0.02,
  "shadow-autoUpdate": false,
}

const OFF = 0

export function VoidLight() {
  const settings = useVoidLightTuning()
  const spotLight = useRef<SpotLight>(null!)
  const target = useMemo(() => new Object3D(), [])
  const debugMode = useDebugMode()
  useHelper(debugMode ? spotLight : null, SpotLightHelper, settings.color)
  useVoidLight(spotLight, settings)
  const { position, target: aimedAt, angle } = voidLightAim(settings)

  return (
    <>
      <primitive object={target} position={aimedAt} />
      <spotLight
        ref={spotLight}
        position={position}
        target={target}
        intensity={OFF}
        color={settings.color}
        angle={angle}
        penumbra={settings.penumbra}
        distance={settings.distance}
        decay={settings.decay}
        castShadow
        shadow-camera-far={settings.distance}
        {...VOID_SHADOW}
      />
    </>
  )
}
