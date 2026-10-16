import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Matrix4, type Mesh, Vector3 } from "three"
import type { WebGPURenderer } from "three/webgpu"
import { renderFurnitureShadow, shadowCastersOf, showCasters } from "./furnitureShadow"
import { lampLightSpot } from "./useLampLight"

type CastFrom = { lamp: Vector3; matrices: Matrix4[] }

export function useFurnitureShadow(meshes: Mesh[]) {
  const renderer = useThree(({ gl }) => gl) as unknown as WebGPURenderer
  const casters = useMemo(() => shadowCastersOf(meshes), [meshes])
  const castFrom = useRef<CastFrom | null>(null)

  useEffect(() => {
    castFrom.current = null
    return showCasters(casters)
  }, [casters])

  useFrame(() => {
    const lamp = lampLightSpot()
    if (!lamp) return
    for (const { mesh } of casters) mesh.updateWorldMatrix(true, false)
    const last = castFrom.current
    if (
      last &&
      last.lamp.equals(lamp) &&
      casters.every(({ mesh }, i) => mesh.matrixWorld.equals(last.matrices[i]))
    )
      return
    castFrom.current = {
      lamp: lamp.clone(),
      matrices: casters.map(({ mesh }) => mesh.matrixWorld.clone()),
    }
    renderFurnitureShadow(renderer, casters, lamp)
  })
}
