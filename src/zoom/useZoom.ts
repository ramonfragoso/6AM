import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { useViewpoint } from "@/debugPlayer/useViewpoint"
import { nightState } from "@/night/night"
import { strangling } from "@/ghost/strangleView"
import { reading } from "@/guides/noteReading"
import { loopState } from "@/passage/loopState"
import { settingsOpen } from "@/settings/settingsMenu"
import { playing } from "@/title/title"
import { preloadSounds } from "@/sound/audioEngine"
import type { PlayingSound } from "@/sound/playSound"
import { useZoomControls } from "./useZoomControls"
import { useZoomTuning } from "./useZoomTuning"
import {
  advanceFarFocus,
  advanceZoom,
  cameraZoom,
  createZoom,
  isFull,
  magnificationOf,
} from "./zoom"
import { playZoomSound } from "./zoomSound"

export function useZoom() {
  const readHeld = useZoomControls()
  const viewed = useViewpoint() === "Player"
  const { maxZoom, duration, maxFocus, focusSeconds, sound } = useZoomTuning()
  const [zoom] = useState(createZoom)
  const playing = useRef<PlayingSound | null>(null)

  useEffect(() => preloadSounds(["zoom"]), [])

  useFrame((_, delta) => {
    const held = viewed && playerHasControl() && readHeld()
    const turn = advanceZoom(zoom, held, delta, duration)
    if (turn) {
      playing.current?.stop()
      playing.current = playZoomSound(turn, duration, sound)
    }
    cameraZoom.magnification = magnificationOf(zoom, maxZoom)
    cameraZoom.progress = zoom.progress
    const { farFocus } = cameraZoom
    farFocus.share = advanceFarFocus(farFocus.share, isFull(zoom), delta, focusSeconds)
    farFocus.maxFocus = maxFocus
  })
}

export function playerHasControl() {
  return (
    playing() &&
    !loopState.passing &&
    !strangling() &&
    !reading() &&
    !settingsOpen() &&
    nightState.phase === "playing"
  )
}
