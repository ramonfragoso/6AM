import type { Material, Texture } from "three"
import { float, Fn, mix, texture, uniform } from "three/tsl"
import type { Node, NodeBuilder, NodeMaterial } from "three/webgpu"
import { furnitureShadow } from "./furnitureShadow"

export const lampShadowStrength = { baked: uniform(1), furniture: uniform(0.85) }

type LampShadowSource = "baked" | "furniture"

const visibilityOf = new WeakMap<Material, Node<"float">>()

export const lampShadowNode = Fn(
  ({ material }: NodeBuilder) => visibilityOf.get(material) ?? float(1),
)()

export function shadeFromLamp(material: Material, occlusionMap: Texture | null) {
  const source: LampShadowSource = occlusionMap ? "baked" : "furniture"
  const fromFurniture = mix(float(1), furnitureShadow(), lampShadowStrength.furniture)
  const visibility = occlusionMap
    ? mix(float(1), texture(occlusionMap).b, lampShadowStrength.baked).mul(fromFurniture)
    : fromFurniture
  visibilityOf.set(material, visibility)
  const nodeMaterial = material as NodeMaterial
  const programKey = nodeMaterial.customProgramCacheKey.bind(nodeMaterial)
  nodeMaterial.customProgramCacheKey = () => `${programKey()}|lamp-${source}`
}
