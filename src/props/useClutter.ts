import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { InstancedMesh, Matrix4, Quaternion, Vector3 } from "three"
import { clutterSettings, MAX_CLUTTER } from "@/haunts/hauntSettings"
import { hauntState } from "@/haunts/hauntState"
import type { Kit } from "@/kit/useKit"
import {
  CLUTTER_VARIANTS,
  type ClutterItem,
  type ClutterVariant,
  type Obstacle,
  scatterClutter,
} from "./clutter"
import { type ClutterModels, clutterModelsOf, clutterSizesOf } from "./clutterModels"

type ClutterMeshes = Record<ClutterVariant, InstancedMesh>

type Scattered = {
  seed: number | null
  count: number
  onLedges: number
  obstacles: readonly Obstacle[]
}

const UP = new Vector3(0, 1, 0)

const turn = new Quaternion()

const scaled = new Vector3()

const matrix = new Matrix4()

export function useClutter(kit: Kit, obstacles: readonly Obstacle[]) {
  const models = useMemo(() => clutterModelsOf(kit), [kit])
  const meshes = useMemo(() => clutterMeshesOf(models), [models])
  const scattered = useRef<Scattered | null>(null)

  useEffect(
    () => () => {
      for (const mesh of Object.values(meshes)) mesh.dispose()
    },
    [meshes],
  )

  useFrame(() => {
    const now = { seed: hauntState.clutterSeed, ...clutterSettings, obstacles }
    if (scattered.current && sameScatter(scattered.current, now)) return
    scattered.current = now
    const items =
      now.seed === null ? [] : scatterClutter(now.seed, now, clutterSizesOf(models), obstacles)
    placeClutter(meshes, models, items)
  })

  return meshes
}

function sameScatter(before: Scattered, now: Scattered) {
  return (
    before.seed === now.seed &&
    before.count === now.count &&
    before.onLedges === now.onLedges &&
    before.obstacles === now.obstacles
  )
}

function clutterMeshesOf(models: ClutterModels): ClutterMeshes {
  const meshes = CLUTTER_VARIANTS.map((variant) => {
    const { geometry, material } = models[variant]
    const mesh = new InstancedMesh(geometry, material, MAX_CLUTTER)
    mesh.count = 0
    mesh.castShadow = !material.transparent
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    return [variant, mesh] as const
  })
  return Object.fromEntries(meshes) as ClutterMeshes
}

function placeClutter(meshes: ClutterMeshes, models: ClutterModels, items: ClutterItem[]) {
  for (const variant of CLUTTER_VARIANTS) {
    const mesh = meshes[variant]
    const own = items.filter((item) => item.variant === variant).slice(0, MAX_CLUTTER)
    own.forEach(({ pose, position, yaw, scale }, index) => {
      matrix.compose(position, turn.setFromAxisAngle(UP, yaw), scaled.setScalar(scale))
      mesh.setMatrixAt(index, matrix.multiply(models[variant].poses[pose]))
    })
    mesh.count = own.length
    mesh.instanceMatrix.needsUpdate = true
  }
}
