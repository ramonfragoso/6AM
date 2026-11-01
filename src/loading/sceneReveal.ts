import type { Camera, Light, Object3D } from "three"

export type SceneReveal = { batches: number; revealed: number; restore: () => void }

type Drawable = Object3D & {
  isMesh?: boolean
  isPoints?: boolean
  isLine?: boolean
  isSprite?: boolean
}

const FIRST_REVEAL_LAYER = 1

const DEFAULT_LAYER = 0

const MOST_BATCHES = 24

export function startSceneReveal(scene: Object3D, camera: Camera): SceneReveal {
  const drawables: Object3D[] = []
  const lights: Light[] = []
  const unculled: Object3D[] = []
  scene.traverse((object) => {
    if ((object as Light).isLight) lights.push(object as Light)
    if (!isDrawable(object)) return
    drawables.push(object)
    if (!object.frustumCulled) return
    object.frustumCulled = false
    unculled.push(object)
  })
  const batches = Math.min(MOST_BATCHES, drawables.length)
  const layerOf = (index: number) => FIRST_REVEAL_LAYER + (index % batches)
  drawables.forEach((drawable, index) => drawable.layers.enable(layerOf(index)))
  for (const light of lights) forEachRevealLayer(batches, (layer) => light.layers.enable(layer))
  camera.layers.disableAll()

  return {
    batches,
    revealed: 0,
    restore: () => {
      drawables.forEach((drawable, index) => drawable.layers.disable(layerOf(index)))
      for (const light of lights) {
        forEachRevealLayer(batches, (layer) => light.layers.disable(layer))
      }
      camera.layers.set(DEFAULT_LAYER)
      for (const object of unculled) object.frustumCulled = true
    },
  }
}

export function revealNextBatch(reveal: SceneReveal, camera: Camera) {
  camera.layers.enable(FIRST_REVEAL_LAYER + reveal.revealed)
  reveal.revealed += 1
}

function forEachRevealLayer(batches: number, act: (layer: number) => void) {
  for (let batch = 0; batch < batches; batch++) act(FIRST_REVEAL_LAYER + batch)
}

function isDrawable(object: Drawable) {
  return Boolean(object.isMesh || object.isPoints || object.isLine || object.isSprite)
}
