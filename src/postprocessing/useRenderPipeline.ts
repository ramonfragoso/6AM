import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import { pass } from "three/tsl"
import { RenderPipeline, type WebGPURenderer } from "three/webgpu"

const TAKES_OVER_RENDERING = 1

export function useRenderPipeline() {
  const renderer = useThree((state) => state.gl) as unknown as WebGPURenderer
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)

  const renderPipeline = useMemo(() => {
    const scenePass = pass(scene, camera)
    return new RenderPipeline(renderer, scenePass)
  }, [renderer, scene, camera])

  useEffect(() => () => renderPipeline.dispose(), [renderPipeline])

  useFrame(() => renderPipeline.render(), TAKES_OVER_RENDERING)
}
