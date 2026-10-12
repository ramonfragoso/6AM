import { useFrame, useThree } from "@react-three/fiber"
import { useRef, useState } from "react"
import { Euler, Vector3 } from "three"
import { createView, turnView } from "@/player/view"
import { useDebugPlayerControls } from "./useDebugPlayerControls"
import { useDebugPlayerTuning } from "./useDebugPlayerTuning"
import { useViewpoint } from "./useViewpoint"

const SPAWN_POSITION = new Vector3(0, 3, 4)

export function useDebugPlayerFlight() {
  const [position] = useState(() => SPAWN_POSITION.clone())
  const view = useRef(createView())
  const camera = useThree((state) => state.camera)
  const readControls = useDebugPlayerControls()
  const { flySpeed } = useDebugPlayerTuning()
  const viewed = useViewpoint() === "DebugPlayer"

  useFrame((_, delta) => {
    const controls = readControls(delta)
    if (!viewed) return
    turnView(view.current, controls.look)
    position.addScaledVector(flyDirection(controls.fly, view.current), flySpeed * delta)
    camera.position.copy(position)
    camera.rotation.copy(view.current)
  })

  return { position, viewed }
}

function flyDirection(fly: Vector3, view: Euler) {
  return new Vector3(fly.x, 0, -fly.z).applyEuler(view).add(new Vector3(0, fly.y, 0))
}
