import { BackSide, type Material, type MeshStandardMaterial, Vector2, Vector4 } from "three"
import {
  float,
  hash,
  instanceIndex,
  materialColor,
  materialRoughness,
  mix,
  mx_noise_float,
  normalMap,
  positionWorld,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl"
import { MeshPhysicalNodeMaterial, MeshStandardNodeMaterial, type Node } from "three/webgpu"

const NO_DIVISION = -1e4

export const kitSurface = {
  occlusion: uniform(1),
  grime: uniform(0.6),
  variation: uniform(0.15),
  variationScale: uniform(0.35),
  tileBrightness: uniform(0.06),
  tileRoughness: uniform(0.08),
}

export const tileClip = {
  enabled: uniform(0),
  origin: uniform(new Vector2()),
  along: uniform(new Vector2()),
  halfAcross: uniform(0),
  divisions: uniform(new Vector4().setScalar(NO_DIVISION)),
  divisionHalfLength: uniform(0),
}

export const TILE_CLIP_DIVISIONS = 4

export const candleWax = {
  roughness: uniform(0.5),
  metalness: uniform(0),
}

const WAX_MATERIAL_PREFIX = "kit_candel__"

const GRIME_TINT = vec3(0.42, 0.36, 0.3)

const GRIME_ROUGHNESS = 0.35

const TILE_MATERIAL_MARKER = "__floor_tile_"

const TILE_OFFSET_SALT = 101

const TILE_BRIGHTNESS_SALT = 211

const TILE_ROUGHNESS_SALT = 307

type KitSourceMaterial = MeshStandardMaterial & { isMeshPhysicalMaterial?: boolean }

type SurfaceInputs = {
  color: Node<"vec3">
  roughness: Node<"float">
}

export type SurfaceOptions = {
  worldVariation?: boolean
  occlusionStrength?: Node<"float">
  grimeStrength?: Node<"float">
}

export function kitSurfaceMaterial(
  source: KitSourceMaterial,
  {
    worldVariation = true,
    occlusionStrength = kitSurface.occlusion,
    grimeStrength = kitSurface.grime,
  }: SurfaceOptions = {},
): Material {
  const surface = source.isMeshPhysicalMaterial
    ? new MeshPhysicalNodeMaterial()
    : new MeshStandardNodeMaterial()
  const target = surface as unknown as Record<string, unknown>
  for (const key in source) target[key] = source[key as keyof KitSourceMaterial]
  surface.shadowSide = BackSide

  const occlusionMap = source.aoMap
  if (!occlusionMap) return surface
  surface.aoMap = null

  const inputs: SurfaceInputs = source.name.includes(TILE_MATERIAL_MARKER)
    ? randomizedTileInputs(source, surface)
    : { color: materialColor.xyz, roughness: materialRoughness }

  if (source.name.startsWith(WAX_MATERIAL_PREFIX)) {
    inputs.roughness = candleWax.roughness
    surface.metalnessNode = candleWax.metalness
  }

  const baked = texture(occlusionMap)
  const occlusion = mix(float(1), baked.r, occlusionStrength)
  const grime = baked.g.mul(grimeStrength)
  const variation = worldVariation
    ? mx_noise_float(positionWorld.mul(kitSurface.variationScale)).mul(kitSurface.variation).add(1)
    : float(1)
  const clean = inputs.color.mul(variation).mul(occlusion)
  const alpha = source.map ? texture(source.map).a : float(1)

  surface.colorNode = vec4(mix(clean, clean.mul(GRIME_TINT), grime), alpha)
  surface.roughnessNode = inputs.roughness.add(grime.mul(GRIME_ROUGHNESS)).clamp(0, 1)
  return surface
}

function randomizedTileInputs(
  source: KitSourceMaterial,
  surface: MeshStandardNodeMaterial,
): SurfaceInputs {
  const tileUv = uv().add(vec2(hash(instanceIndex), hash(instanceIndex.add(TILE_OFFSET_SALT))))
  const spread = (salt: number) => hash(instanceIndex.add(salt)).mul(2).sub(1)
  const tint = uniform(source.color)

  const baseColor = source.map ? texture(source.map, tileUv).rgb.mul(tint) : tint
  const roughness = source.roughnessMap
    ? texture(source.roughnessMap, tileUv).g.mul(source.roughness)
    : float(source.roughness)
  if (source.metalnessMap) {
    surface.metalnessNode = texture(source.metalnessMap, tileUv).b.mul(source.metalness)
  }
  if (source.normalMap) {
    surface.normalNode = normalMap(texture(source.normalMap, tileUv), uniform(source.normalScale))
  }
  if (source.emissiveMap) {
    surface.emissiveNode = texture(source.emissiveMap, tileUv)
      .rgb.mul(uniform(source.emissive))
      .mul(source.emissiveIntensity)
  }

  surface.maskNode = insideTiledArea()

  return {
    color: baseColor.mul(spread(TILE_BRIGHTNESS_SALT).mul(kitSurface.tileBrightness).add(1)),
    roughness: roughness.add(spread(TILE_ROUGHNESS_SALT).mul(kitSurface.tileRoughness)),
  }
}

function insideTiledArea() {
  const along = positionWorld.z.sub(tileClip.origin.y).toVar()
  const across = tileClip.origin.x.sub(positionWorld.x).abs()
  const divisions = [
    tileClip.divisions.x,
    tileClip.divisions.y,
    tileClip.divisions.z,
    tileClip.divisions.w,
  ]
  const inside = divisions.reduce<Node<"bool">>(
    (kept, division) =>
      kept.and(along.sub(division).abs().greaterThan(tileClip.divisionHalfLength)),
    along
      .greaterThanEqual(tileClip.along.x)
      .and(along.lessThanEqual(tileClip.along.y))
      .and(across.lessThanEqual(tileClip.halfAcross)),
  )
  return tileClip.enabled.lessThan(0.5).or(inside)
}
