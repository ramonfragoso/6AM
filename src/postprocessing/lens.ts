import { asin, atan, float, mix, sin, tan, uniform, vec2 } from "three/tsl"
import type { PerspectiveCamera } from "three/webgpu"

export const PROJECTIONS = [
  "Rectilinear",
  "Equidistant",
  "Stereographic",
  "Equisolid",
  "Orthographic",
  "Panini",
] as const

export type Projection = (typeof PROJECTIONS)[number]

export type LensSettings = {
  projection: Projection
  strength: number
  zoom: number
  paniniDistance: number
}

export type Lens = ReturnType<typeof createLens>

const RECTILINEAR = PROJECTIONS.indexOf("Rectilinear")

const EQUIDISTANT = PROJECTIONS.indexOf("Equidistant")

const STEREOGRAPHIC = PROJECTIONS.indexOf("Stereographic")

const EQUISOLID = PROJECTIONS.indexOf("Equisolid")

const PANINI = PROJECTIONS.indexOf("Panini")

const MIN_RADIUS = 1e-5

const DEGREES_TO_HALF_RADIANS = Math.PI / 360

export function createLens() {
  return {
    kind: uniform(RECTILINEAR),
    strength: uniform(0),
    zoom: uniform(1),
    tanHalfFov: uniform(1),
    aspect: uniform(1),
    cornerExtent: uniform(1),
    paniniDistance: uniform(1),
    paniniExtent: uniform(1),
  }
}

export function matchLens(lens: Lens, camera: PerspectiveCamera, settings: LensSettings) {
  const tanHalfFov = Math.tan(camera.fov * DEGREES_TO_HALF_RADIANS)
  lens.kind.value = PROJECTIONS.indexOf(settings.projection)
  lens.strength.value = settings.strength
  lens.zoom.value = settings.zoom
  lens.tanHalfFov.value = tanHalfFov
  lens.aspect.value = camera.aspect
  lens.cornerExtent.value = cornerExtent(settings.projection, tanHalfFov, camera.aspect)
  lens.paniniDistance.value = settings.paniniDistance
  lens.paniniExtent.value = paniniExtent(settings.paniniDistance, tanHalfFov, camera.aspect)
}

function cornerExtent(projection: Projection, tanHalfFov: number, aspect: number) {
  const cornerAngle = Math.atan(tanHalfFov * Math.hypot(aspect, 1))
  if (projection === "Stereographic") return 2 * Math.tan(cornerAngle / 2)
  if (projection === "Equisolid") return 2 * Math.sin(cornerAngle / 2)
  if (projection === "Orthographic") return Math.sin(cornerAngle)
  return cornerAngle
}

function paniniExtent(distance: number, tanHalfFov: number, aspect: number) {
  const edgeAngle = Math.atan(tanHalfFov * aspect)
  const edgeScale = (1 + distance) / (distance + Math.cos(edgeAngle))
  const widest = edgeScale * Math.sin(edgeAngle)
  const tallest = aspect * tanHalfFov * edgeScale * Math.cos(edgeAngle)
  return Math.min(widest, tallest)
}

export function lensUV(uv: any, lens: Lens) {
  const ndc = uv.mul(2).sub(1)
  const lensed = lens.kind
    .equal(RECTILINEAR)
    .select(uv, lens.kind.equal(PANINI).select(paniniUV(ndc, lens), radialUV(ndc, lens)))
  return mix(uv, lensed, lens.strength)
}

function radialUV(ndc: any, lens: Lens) {
  const scaled = ndc.mul(vec2(lens.aspect, 1))
  const diagonal = vec2(lens.aspect, 1).length()
  const radius = scaled.length()
  const extent = radius.div(diagonal).mul(lens.cornerExtent).div(lens.zoom)
  const angle = lens.kind
    .equal(EQUIDISTANT)
    .select(
      extent,
      lens.kind
        .equal(STEREOGRAPHIC)
        .select(
          atan(extent.div(2)).mul(2),
          lens.kind
            .equal(EQUISOLID)
            .select(asin(extent.div(2).clamp(-1, 1)).mul(2), asin(extent.clamp(-1, 1))),
        ),
    )
  const shrink = tan(angle)
    .div(lens.tanHalfFov)
    .div(radius.max(float(MIN_RADIUS)))
  return ndc.mul(shrink).mul(0.5).add(0.5)
}

function paniniUV(ndc: any, lens: Lens) {
  const distance = lens.paniniDistance
  const horizontal = ndc.x.mul(lens.paniniExtent).div(lens.zoom)
  const vertical = ndc.y.mul(lens.paniniExtent).div(lens.aspect).div(lens.zoom)
  const unit = horizontal.div(distance.add(1))
  const yaw = atan(unit).add(
    asin(unit.mul(distance).div(unit.mul(unit).add(1).sqrt()).clamp(-1, 1)),
  )
  const scale = distance.add(1).div(distance.add(yaw.cos()))
  const sourceX = tan(yaw)
  const sourceY = vertical.div(scale.mul(yaw.cos()))
  const source = vec2(sourceX.div(lens.aspect), sourceY).div(lens.tanHalfFov)
  return source.mul(0.5).add(0.5)
}
