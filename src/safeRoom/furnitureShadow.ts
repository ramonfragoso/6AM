import {
  Color,
  DoubleSide,
  HalfFloatType,
  Mesh,
  PerspectiveCamera,
  RenderTarget,
  Scene,
  Sphere,
  Vector3,
} from "three"
import {
  float,
  Fn,
  normalWorld,
  positionWorld,
  select,
  step,
  texture,
  uniform,
  vec2,
  vec4,
} from "three/tsl"
import { MeshBasicNodeMaterial, type WebGPURenderer } from "three/webgpu"

const MAP_SIZE = 512

const NEAR = 0.05

const FAR = 12

const FIT_MARGIN = 1.15

const DEGREES_PER_RADIAN = 180 / Math.PI

const NO_OCCLUDER = new Color(0, 0, 0)

const UP = new Vector3(0, 1, 0)

const ALONG_Z = new Vector3(0, 0, 1)

const NEARLY_VERTICAL = 0.99

const PCF_REACH = [-1, 0, 1] as const

const PCF_TAPS = PCF_REACH.flatMap((x) => PCF_REACH.map((y) => [x, y] as const))

export const furnitureShadowSettings = {
  softness: uniform(2.5),
  bias: uniform(0.02),
  normalBias: uniform(0.01),
}

const lamp = uniform(new Vector3())

const lampView = uniform(new PerspectiveCamera().projectionMatrix.clone())

const cast = uniform(0)

const target = new RenderTarget(MAP_SIZE, MAP_SIZE, { type: HalfFloatType })

const camera = new PerspectiveCamera(1, 1, NEAR, FAR)

const scene = new Scene()
scene.background = NO_OCCLUDER

const inverseDistance = new MeshBasicNodeMaterial({ side: DoubleSide })
inverseDistance.colorNode = vec4(float(1).div(positionWorld.distance(lamp)), 0, 0, 1)
inverseDistance.toneMapped = false

export const furnitureShadow = Fn(() => {
  const receiver = positionWorld.add(normalWorld.mul(furnitureShadowSettings.normalBias))
  const clip = lampView.mul(vec4(receiver, 1)).toVar()
  const ndc = clip.xy.div(clip.w).toVar()
  const coord = vec2(ndc.x.mul(0.5).add(0.5), ndc.y.mul(0.5).add(0.5).oneMinus()).toVar()
  const reach = positionWorld.distance(lamp).sub(furnitureShadowSettings.bias).toVar()
  const texel = furnitureShadowSettings.softness.div(MAP_SIZE)
  const taps = PCF_TAPS.map(([x, y]) =>
    step(texture(target.texture, coord.add(vec2(x, y).mul(texel))).r.mul(reach), 1),
  )
  const lit = taps
    .slice(1)
    .reduce((sum, tap) => sum.add(tap), taps[0])
    .div(PCF_TAPS.length)
  const inside = clip.w
    .greaterThan(0)
    .and(coord.x.greaterThan(0))
    .and(coord.x.lessThan(1))
    .and(coord.y.greaterThan(0))
    .and(coord.y.lessThan(1))
  return select(inside.and(cast.greaterThan(0)), lit, float(1))
})

export type ShadowCaster = { mesh: Mesh; proxy: Mesh }

export function shadowCastersOf(meshes: Mesh[]): ShadowCaster[] {
  return meshes.map((mesh) => {
    const proxy = new Mesh(mesh.geometry, inverseDistance)
    proxy.matrixAutoUpdate = false
    proxy.matrixWorldAutoUpdate = false
    return { mesh, proxy }
  })
}

export function showCasters(casters: ShadowCaster[]) {
  for (const { proxy } of casters) scene.add(proxy)
  return () => {
    for (const { proxy } of casters) scene.remove(proxy)
    cast.value = 0
  }
}

export function renderFurnitureShadow(
  renderer: WebGPURenderer,
  casters: ShadowCaster[],
  lampPosition: Vector3,
) {
  const bounds = new Sphere()
  for (const { mesh, proxy } of casters) {
    proxy.matrixWorld.copy(mesh.matrixWorld)
    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere()
    const sphere = mesh.geometry.boundingSphere!.clone().applyMatrix4(mesh.matrixWorld)
    if (bounds.isEmpty()) bounds.copy(sphere)
    else bounds.union(sphere)
  }
  aimAt(lampPosition, bounds)
  lamp.value.copy(lampPosition)
  lampView.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)

  const previous = renderer.getRenderTarget()
  renderer.setRenderTarget(target)
  renderer.render(scene, camera)
  renderer.setRenderTarget(previous)
  cast.value = 1
}

function aimAt(from: Vector3, bounds: Sphere) {
  const toward = bounds.center.clone().sub(from)
  const distance = Math.max(toward.length(), bounds.radius * FIT_MARGIN + NEAR)
  const vertical = Math.abs(toward.normalize().y) > NEARLY_VERTICAL
  camera.position.copy(from)
  camera.up.copy(vertical ? ALONG_Z : UP)
  camera.lookAt(bounds.center)
  camera.fov =
    2 * Math.asin(Math.min(1, (bounds.radius * FIT_MARGIN) / distance)) * DEGREES_PER_RADIAN
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
}
