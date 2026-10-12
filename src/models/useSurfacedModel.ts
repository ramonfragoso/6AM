import { useMemo } from "react"
import type { Material, Mesh, MeshStandardMaterial, Object3D } from "three"
import { kitSurfaceMaterial } from "@/kit/kitSurface"
import { useModel } from "./useModel"

export type SurfaceTextures = Pick<
  MeshStandardMaterial,
  "map" | "normalMap" | "roughnessMap" | "metalnessMap"
>

export type TexturesFor = (material: Material) => SurfaceTextures | undefined

export function useSurfacedModel(url: string, nodeName: string, texturesFor?: TexturesFor) {
  const { scene } = useModel(url)
  return useMemo(
    () => surfacedCopyOf(scene, url, nodeName, texturesFor),
    [scene, url, nodeName, texturesFor],
  )
}

function surfacedCopyOf(
  scene: Object3D,
  url: string,
  nodeName: string,
  texturesFor: TexturesFor | undefined,
) {
  const root = scene.getObjectByName(nodeName)
  if (!root) throw new Error(`${url} has no "${nodeName}" node; export it again`)
  const surfaces = new Map<Material, Material>()
  const copy = root.clone()
  copy.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    mesh.material = surfaceOf(mesh.material as MeshStandardMaterial, surfaces, texturesFor)
    mesh.castShadow = true
    mesh.receiveShadow = true
  })
  return copy
}

function surfaceOf(
  material: MeshStandardMaterial,
  surfaces: Map<Material, Material>,
  texturesFor: TexturesFor | undefined,
) {
  let surface = surfaces.get(material)
  if (!surface) {
    const textures = texturesFor?.(material)
    surface = kitSurfaceMaterial(textures ? Object.assign(material.clone(), textures) : material)
    surfaces.set(material, surface)
  }
  return surface
}
