import { Vector3, Vector4, type Light, type Object3D, type SpotLight } from "three"
import { uniformArray } from "three/tsl"

export const DUST_LIGHTS = 16

const EVERY_DIRECTION_CONE = -2

const EVERY_DIRECTION_PENUMBRA = -1

const NO_DECAY = 1

const slots = () => Array.from({ length: DUST_LIGHTS }, () => new Vector4())

const placesAndRanges = slots()

const powersAndDecays = slots()

const aims = slots()

const cones = slots()

export const dustLights = {
  placesAndRanges: uniformArray(placesAndRanges, "vec4"),
  powersAndDecays: uniformArray(powersAndDecays, "vec4"),
  aims: uniformArray(aims, "vec4"),
  cones: uniformArray(cones, "vec4"),
}

type ReachingLight = Light & { distance: number; decay: number }

const lightPlace = new Vector3()

const aimedAt = new Vector3()

export function readSceneLights(scene: Object3D) {
  let count = 0
  scene.traverseVisible((object) => {
    if (count >= DUST_LIGHTS || !isReachingLight(object)) return
    writeLight(count, object)
    count++
  })
  for (let slot = count; slot < DUST_LIGHTS; slot++) powersAndDecays[slot].set(0, 0, 0, NO_DECAY)
}

function isReachingLight(object: Object3D): object is ReachingLight {
  const light = object as Object3D & { isPointLight?: boolean; isSpotLight?: boolean }
  return Boolean(light.isPointLight || light.isSpotLight)
}

function writeLight(slot: number, light: ReachingLight) {
  light.getWorldPosition(lightPlace)
  placesAndRanges[slot].set(lightPlace.x, lightPlace.y, lightPlace.z, light.distance)
  const { r, g, b } = light.color
  powersAndDecays[slot].set(
    r * light.intensity,
    g * light.intensity,
    b * light.intensity,
    light.decay,
  )

  if (!(light as SpotLight).isSpotLight) {
    aims[slot].set(0, 0, 0, 0)
    cones[slot].set(EVERY_DIRECTION_CONE, EVERY_DIRECTION_PENUMBRA, 0, 0)
    return
  }
  const spot = light as SpotLight
  spot.target.getWorldPosition(aimedAt)
  aimedAt.sub(lightPlace).normalize()
  aims[slot].set(aimedAt.x, aimedAt.y, aimedAt.z, 0)
  cones[slot].set(Math.cos(spot.angle), Math.cos(spot.angle * (1 - spot.penumbra)), 0, 0)
}
