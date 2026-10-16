import { useHelper } from "@react-three/drei"
import { useMemo, useRef } from "react"
import { Object3D, type SpotLight, SpotLightHelper } from "three"
import { useDebugMode } from "@/debug/useDebugMode"
import type { Placement } from "@/kit/kitPieces"
import { useHouseLightLevel } from "@/passage/useHouseLightLevel"
import { doorLightAim, type DoorLightSettings } from "./doorLight"

type DoorLightProps = { frame: Placement; settings: DoorLightSettings }

export function DoorLight({ frame, settings }: DoorLightProps) {
  const spotLight = useRef<SpotLight>(null!)
  const target = useMemo(() => new Object3D(), [])
  const debugMode = useDebugMode()
  useHelper(debugMode ? spotLight : null, SpotLightHelper, settings.color)
  const { position, target: aimedAt, angle } = doorLightAim(frame, settings)
  useHouseLightLevel(spotLight, settings.intensity)

  return (
    <>
      <primitive object={target} position={aimedAt} />
      <spotLight
        ref={spotLight}
        position={position}
        target={target}
        intensity={settings.intensity}
        color={settings.color}
        angle={angle}
        penumbra={settings.penumbra}
        distance={settings.distance}
        decay={settings.decay}
        castShadow={false}
      />
    </>
  )
}
