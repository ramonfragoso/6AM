import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { MathUtils } from "three"
import { playerPose } from "@/player/playerPose"
import { fogAndDustShown } from "@/safeRoom/safeRoomVolumes"
import { voidOpen } from "./voidOpen"
import { voidSettings } from "./voidSettings"
import { pastVoidDoor } from "./voidSpace"

const OUTSIDE = 0

const INSIDE = 1

export function useVoidPresence() {
  const presence = useRef(OUTSIDE)

  useFrame((_, delta) => {
    const inside = voidOpen() && pastVoidDoor(playerPose.eye) ? INSIDE : OUTSIDE
    const { crossingSeconds } = voidSettings
    const step = crossingSeconds > 0 ? delta / crossingSeconds : INSIDE
    presence.current = voidOpen()
      ? MathUtils.clamp(inside, presence.current - step, presence.current + step)
      : OUTSIDE
    fogAndDustShown.value = INSIDE - presence.current
  })
}
