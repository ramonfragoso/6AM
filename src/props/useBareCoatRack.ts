import { useFrame } from "@react-three/fiber"
import { useMemo } from "react"
import type { Object3D } from "three"
import { hauntState } from "@/haunts/hauntState"

const CLOTHING_PREFIXES = ["kit_coat_rack_fabric", "kit_coat_rack_Hat"]

export function useBareCoatRack(coatRack: Object3D) {
  const clothing = useMemo(() => clothingOf(coatRack), [coatRack])
  useFrame(() => {
    const worn = !hauntState.coatRackBare
    for (const part of clothing) part.visible = worn
  })
}

function clothingOf(coatRack: Object3D) {
  const clothing: Object3D[] = []
  coatRack.traverse((object) => {
    if (CLOTHING_PREFIXES.some((prefix) => object.name.startsWith(prefix))) clothing.push(object)
  })
  return clothing
}
