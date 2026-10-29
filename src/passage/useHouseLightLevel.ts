import { useFrame } from "@react-three/fiber"
import { type RefObject, useMemo } from "react"
import { Color, type ColorRepresentation, type Light } from "three"
import { hauntLight } from "@/haunts/hauntedLight"
import { loopState } from "./loopState"

export function useHouseLightLevel(
  light: RefObject<Light>,
  intensity: number,
  color: ColorRepresentation,
) {
  const base = useMemo(() => new Color(color), [color])
  useFrame(() => hauntLight(light.current, intensity * loopState.houseLevel, base))
}
