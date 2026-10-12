import { Color } from "three"
import {
  cameraPosition,
  cameraProjectionMatrix,
  clamp,
  distance,
  float,
  Fn,
  hash,
  instanceIndex,
  Loop,
  luminance,
  max,
  min,
  mix,
  mod,
  sin,
  smoothstep,
  screenDPR,
  step,
  time,
  uniform,
  uv,
  varying,
  vec3,
  viewportSize,
} from "three/tsl"
import { AdditiveBlending, PointsNodeMaterial, Sprite, type Node } from "three/webgpu"
import { DUST_LIGHTS, dustLights } from "./dustLights"

export const DUST_PARTICLES = 6000

export const dust = {
  amount: uniform(1),
  size: uniform(0.006),
  minPixels: uniform(2),
  maxPixels: uniform(6),
  opacity: uniform(1.2),
  alphaVariation: uniform(0.8),
  twinkle: uniform(0.5),
  twinkleSpeed: uniform(0.6),
  softness: uniform(0.6),
  drift: uniform(0.25),
  driftSpeed: uniform(0.08),
  fall: uniform(0.01),
  spread: uniform(8),
  height: uniform(3),
  nearFade: uniform(0.4),
  color: uniform(new Color("#ffffff")),
  darkVisibility: uniform(0.3),
  lightResponse: uniform(0.5),
  lightLimit: uniform(3),
  lightTint: uniform(0.6),
}

const FULL_TURN = Math.PI * 2

const MIN_RATE = 0.6

const RATE_RANGE = 0.8

const EDGE_FADE_START = 0.75

const SEED_SALTS = [11, 23, 37] as const

const PHASE_SALTS = [41, 53, 67] as const

const RATE_SALTS = [71, 83, 97] as const

const AMOUNT_SALT = 103

const ALPHA_SALT = 127

const TWINKLE_PHASE_SALT = 139

const MIN_FALLOFF_DISTANCE = 0.01

const TINY = 0.0001

const random = (salt: number) => hash(instanceIndex.add(salt))

const randomVector = ([x, y, z]: readonly [number, number, number]) =>
  vec3(random(x), random(y), random(z))

const projectionElement = (column: number, row: number) =>
  (cameraProjectionMatrix as any).element(column).element(row)

const lightSlot = (slots: typeof dustLights.aims, index: Node<"int">) =>
  slots.element(index) as unknown as Node<"vec4">

const lightReaching = (speck: Node<"vec3">) =>
  Fn(() => {
    const received = vec3(0).toVar()
    Loop(DUST_LIGHTS, ({ i }) => {
      const place = lightSlot(dustLights.placesAndRanges, i)
      const power = lightSlot(dustLights.powersAndDecays, i)
      const aim = lightSlot(dustLights.aims, i)
      const cone = lightSlot(dustLights.cones, i)
      const toSpeck = speck.sub(place.xyz)
      const lightDistance = toSpeck.length()
      const falloff = lightDistance.pow(power.w).max(MIN_FALLOFF_DISTANCE).reciprocal()
      const rangeFade = lightDistance.div(place.w.max(TINY)).pow(4).oneMinus().clamp().pow(2)
      const cutoff = place.w.greaterThan(0).select(rangeFade, 1)
      const direction = toSpeck.div(lightDistance.max(TINY))
      const spot = smoothstep(cone.x, cone.y, direction.dot(aim.xyz))
      received.addAssign(power.xyz.mul(falloff).mul(cutoff).mul(spot))
    })
    return received
  })()

export function createDust() {
  const box = vec3(dust.spread, dust.height, dust.spread)
  const corner = vec3(cameraPosition.x, 0, cameraPosition.z).sub(box.mul(vec3(0.5, 0, 0.5)))

  const rate = randomVector(RATE_SALTS).mul(RATE_RANGE).add(MIN_RATE)
  const phase = randomVector(PHASE_SALTS).mul(FULL_TURN)
  const wander = sin(time.mul(dust.driftSpeed).mul(rate).add(phase)).mul(dust.drift)
  const settling = vec3(0, time.mul(dust.fall), 0)
  const drifting = randomVector(SEED_SALTS).mul(box).add(wander).sub(settling)
  const local = mod(drifting.sub(corner), box)
  const position = corner.add(local)

  const fromCenter = local
    .div(box)
    .sub(vec3(0.5, 0.5, 0.5))
    .abs()
    .mul(2)
  const edgeFade = float(1).sub(
    smoothstep(EDGE_FADE_START, 1, max(max(fromCenter.x, fromCenter.z), fromCenter.y)),
  )

  const fromCamera = distance(position, cameraPosition)
  const nearFade = smoothstep(0, dust.nearFade, fromCamera)

  const focalLength = float(projectionElement(1, 1))
  const screenHeight = viewportSize.y.div(screenDPR)
  const projectedPixels = dust.size.mul(focalLength).mul(screenHeight).div(fromCamera.mul(2))
  const pixels = clamp(projectedPixels, dust.minPixels, dust.maxPixels)
  const coverage = min(projectedPixels.div(pixels).pow(2), 1)
  const shown = step(random(AMOUNT_SALT), dust.amount)

  const brightness = mix(1, random(ALPHA_SALT), dust.alphaVariation)
  const twinkleWave = sin(
    time.mul(dust.twinkleSpeed).mul(rate.x).add(random(TWINKLE_PHASE_SALT).mul(FULL_TURN)),
  )
  const twinkle = mix(1, twinkleWave.mul(0.5).add(0.5), dust.twinkle)
  const received = lightReaching(position)
  const glow = min(luminance(received).mul(dust.lightResponse), dust.lightLimit)
  const visibility = dust.darkVisibility.add(glow)
  const strongest = max(max(received.x, received.y), max(received.z, TINY))
  const lightHue = received.div(strongest)
  const baseColor = dust.color as unknown as Node<"vec3">
  const litShare = glow.div(visibility.max(TINY))
  const speckColor = varying(mix(baseColor, baseColor.mul(lightHue), dust.lightTint.mul(litShare)))
  const particleAlpha = varying(
    dust.opacity
      .mul(brightness)
      .mul(twinkle)
      .mul(edgeFade)
      .mul(nearFade)
      .mul(coverage)
      .mul(visibility),
  )

  const fromDotCenter = uv().sub(0.5).length().mul(2)
  const dotShape = float(1).sub(smoothstep(float(1).sub(dust.softness), 1, fromDotCenter))

  const material = new PointsNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: false,
  })
  material.positionNode = position
  material.sizeNode = pixels.mul(shown)
  material.colorNode = speckColor
  material.opacityNode = particleAlpha.mul(dotShape)

  const sprite = new Sprite(material)
  sprite.count = DUST_PARTICLES
  sprite.frustumCulled = false

  return { sprite, dispose: () => material.dispose() }
}
