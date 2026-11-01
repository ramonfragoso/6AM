import {
  type BufferGeometry,
  InstancedMesh,
  type Material,
  Matrix4,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from "three"
import { switchToDerivativeTangents, withoutTangents } from "@/kit/derivativeTangents"
import type { PiecePart } from "@/kit/useKit"

export type PartInstances = { part: PiecePart; mesh: InstancedMesh }

const HIDDEN = new Matrix4().makeScale(0, 0, 0)

const placed = new Matrix4()

export function instancesOf(parts: PiecePart[], count: number): PartInstances[] {
  return parts.map((part) => {
    switchToDerivativeTangents(part.material)
    const mesh = new InstancedMesh(withoutTangents(part.geometry), part.material, count)
    mesh.castShadow = !part.material.transparent
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    return { part, mesh }
  })
}

export function disposeInstances(instances: PartInstances[]) {
  for (const { mesh } of instances) {
    mesh.geometry.dispose()
    mesh.dispose()
  }
}

export function placeInstance({ part, mesh }: PartInstances, index: number, at: Matrix4 | null) {
  mesh.setMatrixAt(index, at ? placed.multiplyMatrices(at, part.matrix) : HIDDEN)
  mesh.instanceMatrix.needsUpdate = true
}

export function meshPartsOf(root: Object3D): PiecePart[] {
  root.updateMatrixWorld(true)
  const parts: PiecePart[] = []
  root.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh || Array.isArray(mesh.material)) return
    parts.push({
      geometry: mesh.geometry,
      material: mesh.material,
      source: mesh.material,
      matrix: mesh.matrixWorld.clone(),
      canvas: false,
    })
  })
  return parts
}
