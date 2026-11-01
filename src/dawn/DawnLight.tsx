import { useHelper } from "@react-three/drei"
import { useMemo, useRef } from "react"
import { type Group, type Mesh, Object3D, type SpotLight, SpotLightHelper } from "three"
import { BackSide, type MeshBasicNodeMaterial } from "three/webgpu"
import { useDebugMode } from "@/debug/useDebugMode"
import { LIGHT_FILLED_BOX, dawnLightAim } from "./dawnLightSpace"
import { useDawnLight } from "./useDawnLight"
import { useDawnLightTuning } from "./useDawnLightTuning"

const OFF = 0

export function DawnLight() {
  const settings = useDawnLightTuning()
  const room = useRef<Group>(null!)
  const box = useRef<Mesh>(null!)
  const glow = useRef<MeshBasicNodeMaterial>(null!)
  const spotLight = useRef<SpotLight>(null!)
  const target = useMemo(() => new Object3D(), [])
  const debugMode = useDebugMode()
  useHelper(debugMode ? spotLight : null, SpotLightHelper, settings.color)
  useDawnLight(
    {
      room,
      box,
      glow,
      spotLight,
    },
    settings,
  )
  const { position, target: aimedAt, angle } = dawnLightAim(settings)

  return (
    <group ref={room} matrixAutoUpdate={false}>
      <mesh ref={box} position={LIGHT_FILLED_BOX.center} scale={0}>
        <boxGeometry args={LIGHT_FILLED_BOX.size} />
        <meshBasicMaterial ref={glow} side={BackSide} />
      </mesh>
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
        castShadow={false}
      />
    </group>
  )
}
