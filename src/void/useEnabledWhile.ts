import { useFrame } from "@react-three/fiber"
import type { RapierCollider } from "@react-three/rapier"
import type { RefObject } from "react"
import { FURNISH_PRIORITY } from "@/world/physicsSettings"

export function useEnabledWhile(
  colliders: RefObject<(RapierCollider | null)[]>,
  enabled: () => boolean,
) {
  useFrame(() => {
    const wanted = enabled()
    for (const collider of colliders.current) {
      if (collider && collider.isEnabled() !== wanted) collider.setEnabled(wanted)
    }
  }, FURNISH_PRIORITY)
}
