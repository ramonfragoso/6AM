import {
  type BufferGeometry,
  InstancedMesh,
  type Material,
  Matrix4,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from "three"
import type { PiecePart } from "@/kit/useKit"

export type PartInstances = { part: PiecePart; mesh: InstancedMesh }

const HIDDEN = new Matrix4().makeScale(0, 0, 0)

const TANGENT = "tangent"

const placed = new Matrix4()

const onDerivativeTangents = new WeakSet<Material>()

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

function switchToDerivativeTangents(material: Material) {
  const { normalScale } = material as MeshStandardMaterial
  if (!normalScale || onDerivativeTangents.has(material)) return
  ;(material as MeshStandardMaterial).normalScale = normalScale.clone().setY(-normalScale.y)
  onDerivativeTangents.add(material)
}

function withoutTangents(geometry: BufferGeometry) {
  const copy = geometry.clone()
  copy.deleteAttribute(TANGENT)
  return copy
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
