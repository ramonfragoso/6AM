import type { BufferGeometry, Material, MeshStandardMaterial } from "three"

const TANGENT = "tangent"

const onDerivativeTangents = new WeakSet<Material>()

export function dropTangents(geometry: BufferGeometry) {
  geometry.deleteAttribute(TANGENT)
}

export function withoutTangents(geometry: BufferGeometry) {
  const copy = geometry.clone()
  dropTangents(copy)
  return copy
}

export function switchToDerivativeTangents(material: Material) {
  const { normalScale } = material as MeshStandardMaterial
  if (!normalScale || onDerivativeTangents.has(material)) return
  ;(material as MeshStandardMaterial).normalScale = normalScale.clone().setY(-normalScale.y)
  onDerivativeTangents.add(material)
}
