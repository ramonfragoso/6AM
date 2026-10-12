import {
  exp,
  float,
  Fn,
  fwidth,
  getViewPosition,
  interleavedGradientNoise,
  Loop,
  rtt,
  screenCoordinate,
  screenUV,
  mx_fractal_noise_float,
  uniform,
  vec2,
  vec3,
  vec4,
} from "three/tsl"
import { gaussianBlur } from "three/addons/tsl/display/GaussianBlurNode.js"
import { Color, RedFormat, UnsignedByteType, type PerspectiveCamera } from "three/webgpu"

const FLOOR_LEVEL = 0

const MIN_FOG_HEIGHT = 0.01

const MIN_DEPTH = 0.001

const MIN_WEIGHT = 0.0001

const MIN_RANGE = 0.001

const MIN_VARIANCE = 0.01

const NOISE_DIRECTION_EPSILON = 0.00001

const WIND = [0.3, 0.05, 0.2] as const

const CLOUD_OCTAVES = 3

const CLOUD_LACUNARITY = 2

const CLOUD_DIMINISH = 0.5

const NOISE_TO_UNIT_SCALE = 0.5

const NOISE_TO_UNIT_OFFSET = 0.5

const UPSAMPLE_RADIUS = 2

export const DENOISERS = ["JBU", "Gaussian blur", "Raw"] as const

export type Denoiser = (typeof DENOISERS)[number]

export type Fog = ReturnType<typeof createFog>

export function createFog(camera: PerspectiveCamera, sceneDepth: any) {
  const uniforms = createFogUniforms()
  const cameraWorldMatrix = uniform(camera.matrixWorld)
  const cameraProjectionInverse = uniform(camera.projectionMatrixInverse)
  const cameraPosition = uniform(camera.position)

  const cloudDensity = Fn(([position]: any[]) => {
    const wind = vec3(uniforms.time).mul(vec3(...WIND))
    const scaled = position.mul(uniforms.cloudScale).add(wind)
    const noise = mx_fractal_noise_float(scaled, CLOUD_OCTAVES, CLOUD_LACUNARITY, CLOUD_DIMINISH)
      .mul(NOISE_TO_UNIT_SCALE)
      .add(NOISE_TO_UNIT_OFFSET)
    const heightAboveFloor = position.y.sub(FLOOR_LEVEL).div(uniforms.height.max(MIN_FOG_HEIGHT))
    const heightFactor = float(1).sub(heightAboveFloor).clamp(0, 1).pow(uniforms.heightFalloff)
    return noise.sub(uniforms.cloudThreshold).max(0).mul(heightFactor)
  })

  const fogAmount = Fn(() => {
    const depth = sceneDepth.sample(screenUV).r
    const viewPosition = getViewPosition(screenUV, depth, cameraProjectionInverse)
    const surface = cameraWorldMatrix.mul(vec4(viewPosition, 1)).xyz
    const ray = surface.sub(cameraPosition)
    const surfaceDistance = ray.length()
    const direction = ray.normalize()

    const slopeY = direction.y
      .greaterThanEqual(0)
      .select(direction.y.max(NOISE_DIRECTION_EPSILON), direction.y.min(-NOISE_DIRECTION_EPSILON))
    const toBottom = float(FLOOR_LEVEL).sub(cameraPosition.y).div(slopeY)
    const toTop = uniforms.height.add(FLOOR_LEVEL).sub(cameraPosition.y).div(slopeY)
    const start = toBottom.min(toTop).max(0)
    const end = toBottom.max(toTop).min(surfaceDistance).min(start.add(uniforms.maxRayDistance))
    const marched = end.sub(start).max(0)

    const stepLength = marched.div(float(uniforms.steps))
    const step = direction.mul(stepLength)
    const dither = interleavedGradientNoise(screenCoordinate.xy)
    const position = cameraPosition.add(direction.mul(start)).add(step.mul(dither)).toVar()

    const accumulated = float(0).toVar()
    Loop(uniforms.steps, () => {
      accumulated.addAssign(cloudDensity(position).mul(stepLength).mul(uniforms.density))
      position.addAssign(step)
    })

    const volumeFog = float(1).sub(accumulated.negate().exp())
    const rangeFog = surfaceDistance
      .sub(uniforms.rangeNear)
      .div(uniforms.rangeFar.sub(uniforms.rangeNear).max(MIN_RANGE))
      .clamp(0, 1)
    return volumeFog.max(rangeFog)
  })

  const lowResolution = rtt(fogAmount(), null, null, {
    type: UnsignedByteType,
    format: RedFormat,
    resolutionScale: uniforms.resolutionScale.value,
  }) as any

  const depthWeightedUpsample = Fn(([uv]: any[]) => {
    const linearDepthAt = (coordinate: any) =>
      getViewPosition(coordinate, sceneDepth.sample(coordinate).r, cameraProjectionInverse)
        .z.negate()
        .max(MIN_DEPTH)

    const centerDepth = linearDepthAt(uv)
    const texel = fwidth(screenUV).div(uniforms.resolutionScale)
    const spatialFactor = float(-0.5).div(
      uniforms.spatialSigma.mul(uniforms.spatialSigma).max(MIN_VARIANCE),
    )
    const depthFactor = uniforms.depthSensitivity.mul(uniforms.depthSensitivity).mul(-0.5)

    const sum = float(0).toVar()
    const weights = float(0).toVar()
    for (let y = -UPSAMPLE_RADIUS; y <= UPSAMPLE_RADIUS; y++) {
      for (let x = -UPSAMPLE_RADIUS; x <= UPSAMPLE_RADIUS; x++) {
        const offset = vec2(float(x), float(y))
        const spatialWeight = exp(offset.dot(offset).mul(spatialFactor))
        const sampleUV = uv.add(offset.mul(texel))
        const depthDifference = linearDepthAt(sampleUV).sub(centerDepth).div(centerDepth.max(0.1))
        const weight = spatialWeight.mul(exp(depthDifference.mul(depthDifference).mul(depthFactor)))
        sum.addAssign(lowResolution.sample(sampleUV).r.mul(weight))
        weights.addAssign(weight)
      }
    }
    return sum.div(weights.max(MIN_WEIGHT))
  })

  const blurred = gaussianBlur(lowResolution, uniforms.blurRadius)

  const amountAt = (denoiser: Denoiser, uv: any) => {
    if (denoiser === "JBU") return depthWeightedUpsample(uv)
    if (denoiser === "Gaussian blur") return blurred.getTextureNode().sample(uv).r
    return lowResolution.sample(uv).r
  }

  const setResolutionScale = (scale: number) => void lowResolution.setResolutionScale(scale)

  const dispose = () => {
    lowResolution.dispose()
    blurred.dispose()
  }

  return {
    uniforms,
    amountAt,
    setResolutionScale,
    dispose,
  }
}

function createFogUniforms() {
  return {
    color: uniform(new Color()),
    resolutionScale: uniform(1),
    steps: uniform(1),
    density: uniform(0),
    heightFalloff: uniform(1),
    height: uniform(1),
    cloudScale: uniform(1),
    cloudThreshold: uniform(0),
    maxRayDistance: uniform(1),
    spatialSigma: uniform(1),
    depthSensitivity: uniform(1),
    blurRadius: uniform(0),
    rangeNear: uniform(0),
    rangeFar: uniform(1),
    time: uniform(0),
  }
}
