import { useHelper } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { levaStore } from "leva"
import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react"
import { PointLight, PointLightHelper, type Vector3Tuple } from "three"
import { useDebugMode } from "@/debug/useDebugMode"
import { type Flame, FLAME_GROUPS, type FlameGroup, type FlamesByGroup, flameSize } from "./flames"
import type { FlameLightSettings, FlameSettings } from "./useFlamesTuning"

const WAVER_SPEEDS = [11, 23.7] as const

const WAVER_WEIGHTS = [0.6, 0.4] as const

const PHASE_PER_LIGHT = 1.7

const LIGHT_IN_FLAME = 0.4

const HELPER_SIZE = 0.1

const FLAME_SHADOW = {
  "shadow-mapSize-width": 512,
  "shadow-mapSize-height": 512,
  "shadow-camera-near": 0.02,
  "shadow-bias": -0.0005,
  "shadow-normalBias": 0.02,
  "shadow-autoUpdate": false,
}

type GroupSettings = Record<FlameGroup, FlameSettings>

type FlameLightsProps = { flames: FlamesByGroup; settings: GroupSettings }

type PointLights = RefObject<(PointLight | null)[]>

export type LitFlame = { position: Vector3Tuple; light: FlameLightSettings; castShadow: boolean }

export function FlameLights({ flames, settings }: FlameLightsProps) {
  const lit = useMemo(() => litFlames(flames, settings), [flames, settings])
  return <LitFlames lit={lit} />
}

export function LitFlames({ lit }: { lit: LitFlame[] }) {
  const pointLights = useRef<(PointLight | null)[]>([])
  useStaticShadows(pointLights, lit)
  useFrame(({ clock }) => waver(pointLights.current, lit, clock.elapsedTime))

  return lit.map((flame, index) => (
    <FlameLight key={index} flame={flame} index={index} pointLights={pointLights} />
  ))
}

type FlameLightProps = { flame: LitFlame; index: number; pointLights: PointLights }

function FlameLight({ flame, index, pointLights }: FlameLightProps) {
  const { position, light, castShadow } = flame
  const pointLight = useRef<PointLight>(null!)
  const debugMode = useDebugMode()
  useHelper(debugMode ? pointLight : null, PointLightHelper, HELPER_SIZE, light.color)
  const attach = useCallback(
    (created: PointLight | null) => {
      pointLight.current = created!
      pointLights.current[index] = created
    },
    [pointLights, index],
  )

  return (
    <pointLight
      ref={attach}
      position={position}
      intensity={light.intensity}
      color={light.color}
      distance={light.distance}
      decay={light.decay}
      castShadow={castShadow}
      shadow-camera-far={light.distance}
      {...FLAME_SHADOW}
    />
  )
}

function litFlames(flames: FlamesByGroup, settings: GroupSettings): LitFlame[] {
  return FLAME_GROUPS.flatMap((group) =>
    flames[group].map((flame) => ({
      position: lightPosition(flame, settings[group]),
      light: settings[group].light,
      castShadow: true,
    })),
  )
}

function lightPosition(flame: Flame, { fire }: FlameSettings): Vector3Tuple {
  const { height } = flameSize(flame, fire)
  return [flame.base.x, flame.base.y + height * LIGHT_IN_FLAME, flame.base.z]
}

function useStaticShadows(pointLights: PointLights, lit: LitFlame[]) {
  useEffect(() => {
    const refresh = () => {
      for (const light of pointLights.current) if (light) light.shadow.needsUpdate = true
    }
    refresh()
    return levaStore.useStore.subscribe(refresh)
  }, [pointLights, lit])
}

function waver(pointLights: (PointLight | null)[], lit: LitFlame[], time: number) {
  lit.forEach(({ light }, index) => {
    const pointLight = pointLights[index]
    if (!pointLight) return
    const phase = index * PHASE_PER_LIGHT
    const wave =
      WAVER_WEIGHTS[0] * Math.sin(time * WAVER_SPEEDS[0] + phase) +
      WAVER_WEIGHTS[1] * Math.sin(time * WAVER_SPEEDS[1] + 2 * phase)
    pointLight.intensity = light.intensity * (1 + light.flicker * wave)
  })
}
