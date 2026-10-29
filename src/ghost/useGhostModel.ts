import { useMemo } from "react"
import type { Material, MeshStandardMaterial, Object3D, SkinnedMesh } from "three"
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js"
import { useModel } from "@/models/useModel"
import { BODY_RENDER_ORDER, DECAL_RENDER_ORDER, ghostSurface, isDecal } from "./ghostLook"
import { GHOST_ROOT, GHOST_URL } from "./ghost"

export function useGhostModel() {
  const { scene, animations } = useModel(GHOST_URL)
  const ghost = useMemo(() => surfacedGhost(scene), [scene])
  return { ghost, clips: animations }
}

function surfacedGhost(scene: Object3D) {
  const root = scene.getObjectByName(GHOST_ROOT)
  if (!root) throw new Error(`${GHOST_URL} has no "${GHOST_ROOT}" node; export it again`)
  const copy = clone(root)
  const surfaces = new Map<Material, Material>()
  copy.traverse((object) => {
    const mesh = object as SkinnedMesh
    if (!mesh.isSkinnedMesh) return
    const loaded = mesh.material as MeshStandardMaterial
    let surface = surfaces.get(loaded)
    if (!surface) {
      surface = ghostSurface(loaded)
      surfaces.set(loaded, surface)
    }
    mesh.material = surface
    mesh.renderOrder = isDecal(loaded) ? DECAL_RENDER_ORDER : BODY_RENDER_ORDER
    mesh.castShadow = false
    mesh.receiveShadow = true
    mesh.frustumCulled = false
  })
  return copy
}
