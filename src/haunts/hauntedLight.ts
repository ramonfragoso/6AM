import type { Color, Light } from "three"
import { Color as ThreeColor } from "three"
import { hauntState } from "./hauntState"

const tint = new ThreeColor()

export function hauntLight(light: Light, intensity: number, color: Color) {
  light.intensity = intensity * hauntState.houseLight
  light.color.copy(color)
  if (hauntState.houseTint > 0)
    light.color.lerp(tint.setHex(hauntState.houseTintColor), hauntState.houseTint)
}
