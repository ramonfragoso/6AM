import { useHelper } from "@react-three/drei"
import { useRef } from "react"
import * as THREE from "three/webgpu"
import { useDebugMode } from "@/debug/useDebugMode"
import { useWorldTuning } from "./useWorldTuning"

const DIRECTIONAL_LIGHT_POSITION: THREE.Vector3Tuple = [0, 5, 0]

const DIRECTIONAL_SHADOW = {
  castShadow: true,
  "shadow-mapSize-width": 2048,
  "shadow-mapSize-height": 2048,
  "shadow-camera-near": 0.5,
  "shadow-camera-far": 80,
  "shadow-camera-left": -22,
  "shadow-camera-right": 22,
  "shadow-camera-top": 22,
  "shadow-camera-bottom": -22,
}

const POINT_SHADOW = {
  castShadow: true,
  "shadow-mapSize-width": 512,
  "shadow-mapSize-height": 512,
  "shadow-camera-near": 0.5,
  "shadow-camera-far": 80,
}

export function Lights() {
  const debugMode = useDebugMode()
  const { lighting } = useWorldTuning()
  const directionalLight = useRef<THREE.DirectionalLight>(null!)
  const pointLight = useRef<THREE.PointLight>(null!)

  useHelper(
    debugMode ? directionalLight : null,
    THREE.DirectionalLightHelper,
    1,
    lighting.directionalColor,
  )
  useHelper(debugMode ? pointLight : null, THREE.PointLightHelper, 0.5, lighting.pointColor)

  return (
    <>
      <ambientLight intensity={lighting.ambientIntensity} />
      <directionalLight
        ref={directionalLight}
        position={DIRECTIONAL_LIGHT_POSITION}
        intensity={lighting.directionalIntensity}
        color={lighting.directionalColor}
        {...DIRECTIONAL_SHADOW}
      />
      <pointLight
        ref={pointLight}
        position={lighting.pointPosition}
        intensity={lighting.pointIntensity}
        color={lighting.pointColor}
        {...POINT_SHADOW}
      />
    </>
  )
}
