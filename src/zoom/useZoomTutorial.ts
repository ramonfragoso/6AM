import { useFrame } from "@react-three/fiber"
import { type RefObject, useState } from "react"
import { useViewpoint } from "@/debugPlayer/useViewpoint"
import { useDeviceData } from "@/input/useDeviceData"
import { nightState } from "@/night/night"
import { loopState } from "@/passage/loopState"
import { playerHasControl } from "./useZoom"
import { useZoomTutorialTuning } from "./useZoomTutorialTuning"
import { cameraZoom } from "./zoom"
import { advanceZoomTutorial, createZoomTutorial } from "./zoomTutorial"

export const ZOOM_FILL_PROPERTY = "--zoom-fill"

export function useZoomTutorial(copy: RefObject<HTMLElement | null>) {
  const settings = useZoomTutorialTuning()
  const viewed = useViewpoint() === "Player"
  const [tutorial] = useState(createZoomTutorial)

  useDeviceData(copy)

  useFrame(({ clock }, delta) => {
    const element = copy.current
    if (!element) return
    const moment = {
      teaching: viewed && inFirstCorridors() && playerHasControl(),
      progress: cameraZoom.progress,
      time: clock.elapsedTime,
      delta,
    }
    advanceZoomTutorial(tutorial, moment, settings)
    element.style.opacity = `${tutorial.opacity}`
    element.style.setProperty(ZOOM_FILL_PROPERTY, `${tutorial.fill}`)
  })
}

function inFirstCorridors() {
  return nightState.loops.length === 0 && loopState.whereabouts === "house"
}
