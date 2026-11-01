import { exp, float, Fn, getViewPosition, mix, texture, uniform, vec2, vec4 } from "three/tsl"
import {
  HalfFloatType,
  NodeMaterial,
  QuadMesh,
  RedFormat,
  RenderTarget,
  type PerspectiveCamera,
  type WebGPURenderer,
} from "three/webgpu"

const FOCUS_TEXELS = 1

const SCREEN_CENTER = vec2(0.5, 0.5)

export type FocusSettings = {
  nearerSpeed: number
  fartherSpeed: number
  minFocus: number
  maxFocus: number
  spread: number
}

export type Focus = ReturnType<typeof createFocus>

export function createFocus(camera: PerspectiveCamera, sceneDepth: any) {
  const uniforms = createFocusUniforms()
  const projectionInverse = uniform(camera.projectionMatrixInverse)
  const targets = [focusTarget(), focusTarget()]
  const previous = texture(targets[0].texture)
  const current = texture(targets[1].texture)
  const material = new NodeMaterial()
  const quad = new QuadMesh(material)
  let written = 1

  const distanceAt = (uv: any) =>
    getViewPosition(uv, sceneDepth.sample(uv).r, projectionInverse).z.negate()

  const easedFocus = Fn(() => {
    const across = vec2(uniforms.spread.div(uniforms.aspect), 0)
    const up = vec2(0, uniforms.spread)
    const nearest = distanceAt(SCREEN_CENTER)
      .min(distanceAt(SCREEN_CENTER.add(across)))
      .min(distanceAt(SCREEN_CENTER.sub(across)))
      .min(distanceAt(SCREEN_CENTER.add(up)))
      .min(distanceAt(SCREEN_CENTER.sub(up)))
    const target = nearest.clamp(uniforms.minFocus, uniforms.maxFocus)
    const last = previous.sample(SCREEN_CENTER).r
    const speed = target.lessThan(last).select(uniforms.nearerSpeed, uniforms.fartherSpeed)
    const share = float(1).sub(exp(speed.negate().mul(uniforms.deltaTime)))
    const focus = last.greaterThan(0).select(mix(last, target, share), target)
    return vec4(focus, 0, 0, 1)
  })

  material.fragmentNode = easedFocus()

  const update = (renderer: WebGPURenderer, delta: number, settings: FocusSettings) => {
    uniforms.deltaTime.value = delta
    uniforms.aspect.value = camera.aspect
    uniforms.nearerSpeed.value = settings.nearerSpeed
    uniforms.fartherSpeed.value = settings.fartherSpeed
    uniforms.minFocus.value = settings.minFocus
    uniforms.maxFocus.value = settings.maxFocus
    uniforms.spread.value = settings.spread

    const read = written
    written = 1 - written
    previous.value = targets[read].texture
    const shownTarget = renderer.getRenderTarget()
    renderer.setRenderTarget(targets[written])
    quad.render(renderer)
    renderer.setRenderTarget(shownTarget)
    current.value = targets[written].texture
  }

  const dispose = () => {
    targets.forEach((target) => target.dispose())
    material.dispose()
  }

  return {
    distance: current.sample(SCREEN_CENTER).r,
    update,
    dispose,
  }
}

function focusTarget() {
  return new RenderTarget(FOCUS_TEXELS, FOCUS_TEXELS, {
    depthBuffer: false,
    type: HalfFloatType,
    format: RedFormat,
  })
}

function createFocusUniforms() {
  return {
    deltaTime: uniform(0),
    aspect: uniform(1),
    nearerSpeed: uniform(1),
    fartherSpeed: uniform(1),
    minFocus: uniform(0),
    maxFocus: uniform(1),
    spread: uniform(0),
  }
}
