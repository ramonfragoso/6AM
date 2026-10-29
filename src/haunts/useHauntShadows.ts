import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { refreshStaticShadows } from "@/props/FlameLights"
import { type HauntState, hauntState } from "./hauntState"

type ShadowedState = Pick<
  HauntState,
  "paintingSwaps" | "crucifixInverted" | "coatRackBare" | "tilesTurned" | "clutterSeed"
>

export function useHauntShadows() {
  const shown = useRef<ShadowedState | null>(null)

  useFrame(() => {
    const now = shadowedState()
    if (shown.current && sameShadows(shown.current, now)) return
    shown.current = now
    refreshStaticShadows()
  })
}

function shadowedState(): ShadowedState {
  const { paintingSwaps, crucifixInverted, coatRackBare, tilesTurned, clutterSeed } = hauntState
  return {
    paintingSwaps,
    crucifixInverted,
    coatRackBare,
    tilesTurned,
    clutterSeed,
  }
}

function sameShadows(before: ShadowedState, now: ShadowedState) {
  return (Object.keys(now) as (keyof ShadowedState)[]).every((key) => before[key] === now[key])
}
