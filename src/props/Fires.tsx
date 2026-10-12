import { useLoader } from "@react-three/fiber"
import { FireMesh } from "@wolffo/three-fire/tsl/vanilla"
import { useEffect, useLayoutEffect, useMemo } from "react"
import { type Texture, TextureLoader } from "three"
import {
  FLAME_GROUPS,
  type FlameGroup,
  type FlamePoint,
  type FlamesByGroup,
  flameSize,
} from "./flames"
import type { FireSettings, FlameSettings } from "./useFlamesTuning"

const FIRE_TEXTURE_URL = "/textures/fire.png"

type FiresProps = { flames: FlamesByGroup; settings: Record<FlameGroup, FlameSettings> }

export function useFireTexture() {
  return useLoader(TextureLoader, FIRE_TEXTURE_URL)
}

export function Fires({ flames, settings }: FiresProps) {
  const texture = useFireTexture()
  return FLAME_GROUPS.map((group) => (
    <FireGroup
      key={group}
      texture={texture}
      flames={flames[group]}
      settings={settings[group].fire}
    />
  ))
}

type FireGroupProps = { texture: Texture; flames: FlamePoint[]; settings: FireSettings }

export function FireGroup({ texture, flames, settings }: FireGroupProps) {
  const fires = useFireMeshes(texture, flames.length, settings.iterations, settings.octaves)
  const { width, height, color, magnitude, lacunarity, gain } = settings

  useLayoutEffect(() => {
    fires.forEach((fire, index) => {
      const size = flameSize(flames[index], { width, height })
      fire.scale.set(size.width, size.height, size.width)
      fire.position.copy(flames[index].base).setY(flames[index].base.y + size.height / 2)
      fire.update()
    })
  }, [fires, flames, width, height])

  useEffect(() => {
    for (const fire of fires) {
      fire.fireColor = color
      Object.assign(fire, { magnitude, lacunarity, gain })
    }
  }, [fires, color, magnitude, lacunarity, gain])

  return fires.map((fire) => <primitive key={fire.uuid} object={fire} />)
}

function useFireMeshes(texture: Texture, count: number, iterations: number, octaves: number) {
  const fires = useMemo(
    () => Array.from({ length: count }, () => depthTestedFire(texture, iterations, octaves)),
    [texture, count, iterations, octaves],
  )
  useEffect(() => () => fires.forEach((fire) => fire.dispose()), [fires])
  return fires
}

function depthTestedFire(texture: Texture, iterations: number, octaves: number) {
  const fire = new FireMesh({ fireTex: texture, iterations, octaves })
  fire.material.depthTest = true
  return fire
}
