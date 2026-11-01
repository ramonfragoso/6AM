import { useFrame, useThree } from "@react-three/fiber"
import { useRef } from "react"
import { refreshStaticShadows } from "@/props/FlameLights"
import { downloadsFinished, releaseDownloads } from "./downloads"
import { loading } from "./loading"
import { revealNextBatch, type SceneReveal, startSceneReveal } from "./sceneReveal"

const SMOOTH_FRAME_SECONDS = 1 / 20

const SMOOTH_FRAMES_TO_WARM = 12

const LONGEST_WARM_UP_SECONDS = 12

export function useWarmUp() {
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const reveal = useRef<SceneReveal | null>(null)
  const warming = useRef({ smoothFrames: 0, seconds: 0 })

  useFrame((_, delta) => {
    if (loading.stage === "loading" && downloadsFinished() && loading.waitingBoundaries === 0) {
      loading.stage = "compiling"
      reveal.current = startSceneReveal(scene, camera)
    }
    const revealing = reveal.current
    if (loading.stage === "compiling" && revealing) {
      loading.compiled = revealing.revealed / revealing.batches
      if (revealing.revealed < revealing.batches) {
        revealNextBatch(revealing, camera)
        return
      }
      revealing.restore()
      reveal.current = null
      refreshStaticShadows()
      loading.compiled = 1
      loading.stage = "warming"
      return
    }
    if (loading.stage !== "warming") return
    const progress = warming.current
    progress.seconds += delta
    progress.smoothFrames = delta < SMOOTH_FRAME_SECONDS ? progress.smoothFrames + 1 : 0
    loading.warmed = Math.max(loading.warmed, progress.smoothFrames / SMOOTH_FRAMES_TO_WARM)
    if (
      progress.smoothFrames < SMOOTH_FRAMES_TO_WARM &&
      progress.seconds < LONGEST_WARM_UP_SECONDS
    ) {
      return
    }
    loading.warmed = 1
    loading.stage = "ready"
    releaseDownloads()
  })
}
