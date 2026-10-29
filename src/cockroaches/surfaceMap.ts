import { type Box3, Vector3 } from "three"

export type Profile = {
  length: number
  spacing: number
  floorHalf: number
  rightSeam: number
  wallArc: number
  across: Float32Array
  height: Float32Array
  smoothAcross: Float32Array
  smoothHeight: Float32Array
  normalAcross: Float32Array
  normalHeight: Float32Array
}

export type Rect = {
  u0: number
  u1: number
  v0: number
  v1: number
}

export type Region = {
  from: number
  to: number
  acrossMin: number
  acrossMax: number
  below: number
  above: number
}

export type Portal = { from: number; to: number; into: number }

export type Strip = {
  profile: Profile
  origin: Vector3
  along: Vector3
  across: Vector3
  from: number
  to: number
  fixed: readonly Rect[]
  blocked: readonly Rect[]
  portal: Portal | null
}

export type SurfaceFrame = {
  position: Vector3
  normal: Vector3
  forward: Vector3
  tangent: Vector3
}

export type WallSide = "left" | "right"

type ProfileStep = readonly [inset: number, height: number]

type ProfilePoint = readonly [across: number, height: number]

export const BASEBOARD_INSET = 0.2

export const PLASTER_INSET = 0.05

const WALL_PROFILE: readonly ProfileStep[] = [
  [BASEBOARD_INSET, 0],
  [BASEBOARD_INSET, 0.18],
  [0.18, 0.18],
  [0.18, 0.98],
  [0.173, 1],
  [PLASTER_INSET, 1],
  [PLASTER_INSET, 3],
  [0.075, 3.04],
  [0.093, 3.08],
  [0.102, 3.12],
  [0.106, 3.16],
  [0.118, 3.2],
  [0.143, 3.22],
  [0.15, 3.24],
  [0.15, 3.3],
]

const ROOF_VAULT: readonly ProfilePoint[] = [
  [0.7, 3.3],
  [0.65, 3.38],
  [0.6, 3.46],
  [0.55, 3.54],
  [0.5, 3.6],
  [0.4, 3.65],
  [0.3, 3.69],
  [0.15, 3.71],
  [0, 3.72],
]

const WALL_ARC = WALL_PROFILE.slice(1).reduce(
  (sum, [inset, height], index) =>
    sum + Math.hypot(inset - WALL_PROFILE[index][0], height - WALL_PROFILE[index][1]),
  0,
)

const SAMPLE_SPACING = 0.01

const SMOOTHING = 0.025

const MIN_SEGMENT = 1e-6

const UP = new Vector3(0, 1, 0)

const toward = new Vector3()

export function corridorProfile(halfWidth: number): Profile {
  const points = profilePoints(halfWidth)
  const lengths = points.map((point, index) => {
    const next = points[(index + 1) % points.length]
    return Math.hypot(next[0] - point[0], next[1] - point[1])
  })
  const length = lengths.reduce((sum, segment) => sum + segment, 0)
  const count = Math.round(length / SAMPLE_SPACING)
  const spacing = length / count
  const across = new Float32Array(count)
  const height = new Float32Array(count)
  const rawNormalAcross = new Float32Array(count)
  const rawNormalHeight = new Float32Array(count)
  let segment = 0
  let segmentStart = 0
  for (let index = 0; index < count; index++) {
    const at = index * spacing
    while (at > segmentStart + lengths[segment] || lengths[segment] < MIN_SEGMENT) {
      segmentStart += lengths[segment]
      segment++
    }
    const [a0, h0] = points[segment]
    const [a1, h1] = points[(segment + 1) % points.length]
    const share = (at - segmentStart) / lengths[segment]
    across[index] = a0 + (a1 - a0) * share
    height[index] = h0 + (h1 - h0) * share
    rawNormalAcross[index] = -(h1 - h0) / lengths[segment]
    rawNormalHeight[index] = (a1 - a0) / lengths[segment]
  }
  const floorHalf = halfWidth - BASEBOARD_INSET
  return {
    length,
    spacing,
    floorHalf,
    rightSeam: 2 * floorHalf,
    wallArc: WALL_ARC,
    across,
    height,
    ...smoothed(across, height, rawNormalAcross, rawNormalHeight, Math.round(SMOOTHING / spacing)),
  }
}

function profilePoints(halfWidth: number): ProfilePoint[] {
  const rightWall = WALL_PROFILE.map(([inset, height]): ProfilePoint => [halfWidth - inset, height])
  const leftWall = rightWall.map(([across, height]): ProfilePoint => [-across, height]).reverse()
  const vault = [
    ...ROOF_VAULT,
    ...ROOF_VAULT.slice(0, -1)
      .reverse()
      .map(([across, height]): ProfilePoint => [-across, height]),
  ]
  return [leftWall[leftWall.length - 1], ...rightWall, ...vault, ...leftWall.slice(0, -1)]
}

function smoothed(
  across: Float32Array,
  height: Float32Array,
  normalAcross: Float32Array,
  normalHeight: Float32Array,
  radius: number,
) {
  const count = across.length
  const result = {
    smoothAcross: new Float32Array(count),
    smoothHeight: new Float32Array(count),
    normalAcross: new Float32Array(count),
    normalHeight: new Float32Array(count),
  }
  const window = 2 * radius + 1
  for (let index = 0; index < count; index++) {
    let sumAcross = 0
    let sumHeight = 0
    let sumNormalAcross = 0
    let sumNormalHeight = 0
    for (let offset = -radius; offset <= radius; offset++) {
      const sample = (index + offset + count) % count
      sumAcross += across[sample]
      sumHeight += height[sample]
      sumNormalAcross += normalAcross[sample]
      sumNormalHeight += normalHeight[sample]
    }
    const normalLength = Math.hypot(sumNormalAcross, sumNormalHeight)
    result.smoothAcross[index] = sumAcross / window
    result.smoothHeight[index] = sumHeight / window
    result.normalAcross[index] = sumNormalAcross / normalLength
    result.normalHeight[index] = sumNormalHeight / normalLength
  }
  return result
}

export function wrapV(profile: Profile, v: number) {
  const wrapped = v % profile.length
  return wrapped < 0 ? wrapped + profile.length : wrapped
}

export function vDistance(profile: Profile, from: number, to: number) {
  const difference = wrapV(profile, to - from)
  return difference > profile.length / 2 ? difference - profile.length : difference
}

export function onFloor(profile: Profile, v: number) {
  return wrapV(profile, v) <= profile.rightSeam
}

export function floorV(profile: Profile, across: number) {
  return across + profile.floorHalf
}

export function floorAcross(profile: Profile, v: number) {
  return v - profile.floorHalf
}

export function seamV(profile: Profile, side: WallSide) {
  return side === "right" ? profile.rightSeam : 0
}

export function upward(side: WallSide) {
  return side === "right" ? 1 : -1
}

export function wallSideAcross(profile: Profile, side: WallSide) {
  return side === "right" ? profile.floorHalf : -profile.floorHalf
}

export function isFree(strip: Strip, u: number, v: number) {
  if (u < strip.from || u > strip.to) return false
  const wrapped = wrapV(strip.profile, v)
  for (const rect of strip.blocked) {
    if (u >= rect.u0 && u <= rect.u1 && wrapped >= rect.v0 && wrapped <= rect.v1) return false
  }
  return true
}

export function stripPoint(strip: Strip, x: number, z: number): [u: number, across: number] {
  const dx = x - strip.origin.x
  const dz = z - strip.origin.z
  return [dx * strip.along.x + dz * strip.along.z, dx * strip.across.x + dz * strip.across.z]
}

export function worldPoint(strip: Strip, u: number, across: number, height: number, out: Vector3) {
  return out
    .copy(strip.origin)
    .addScaledVector(strip.along, u)
    .addScaledVector(strip.across, across)
    .setY(height)
}

export function regionOf(strip: Strip, box: Box3, margin: number): Region {
  const [u0, a0] = stripPoint(strip, box.min.x, box.min.z)
  const [u1, a1] = stripPoint(strip, box.max.x, box.max.z)
  return {
    from: Math.min(u0, u1) - margin,
    to: Math.max(u0, u1) + margin,
    acrossMin: Math.min(a0, a1) - margin,
    acrossMax: Math.max(a0, a1) + margin,
    below: box.min.y - margin,
    above: box.max.y + margin,
  }
}

export function rectsOf(profile: Profile, region: Region): Rect[] {
  const rects: Rect[] = []
  let start = -1
  const count = profile.across.length
  for (let index = 0; index <= count; index++) {
    const inside = index < count && insideRegion(profile, index, region)
    if (inside && start < 0) start = index
    if (!inside && start >= 0) {
      rects.push({
        u0: region.from,
        u1: region.to,
        v0: Math.max(start - 1, 0) * profile.spacing,
        v1: Math.min(index, count) * profile.spacing,
      })
      start = -1
    }
  }
  return rects
}

function insideRegion(profile: Profile, index: number, region: Region) {
  const across = profile.across[index]
  const height = profile.height[index]
  return (
    across >= region.acrossMin &&
    across <= region.acrossMax &&
    height >= region.below &&
    height <= region.above
  )
}

export function surfaceFrame(
  strip: Strip,
  u: number,
  v: number,
  heading: number,
  frame: SurfaceFrame,
) {
  const { profile } = strip
  const at = wrapV(profile, v) / profile.spacing
  const index = Math.floor(at)
  const next = (index + 1) % profile.across.length
  const share = at - index
  const across = mix(profile.smoothAcross, index, next, share)
  const height = mix(profile.smoothHeight, index, next, share)
  const normalAcross = mix(profile.normalAcross, index, next, share)
  const normalHeight = mix(profile.normalHeight, index, next, share)
  worldPoint(strip, u, across, height, frame.position)
  frame.normal
    .copy(strip.across)
    .multiplyScalar(normalAcross)
    .addScaledVector(UP, normalHeight)
    .normalize()
  frame.tangent.copy(strip.across).multiplyScalar(normalHeight).addScaledVector(UP, -normalAcross)
  frame.forward
    .copy(strip.along)
    .multiplyScalar(Math.cos(heading))
    .addScaledVector(frame.tangent, Math.sin(heading))
    .normalize()
  return frame
}

export function headingAlong(strip: Strip, frame: SurfaceFrame, direction: Vector3) {
  toward.copy(direction)
  return Math.atan2(toward.dot(frame.tangent), toward.dot(strip.along))
}

export function newSurfaceFrame(): SurfaceFrame {
  return {
    position: new Vector3(),
    normal: new Vector3(),
    forward: new Vector3(),
    tangent: new Vector3(),
  }
}

function mix(values: Float32Array, index: number, next: number, share: number) {
  return values[index] + (values[next] - values[index]) * share
}
