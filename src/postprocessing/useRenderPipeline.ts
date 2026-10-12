import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import type { PerspectiveCamera, WebGPURenderer } from "three/webgpu"
import { createPostProcessing } from "./postProcessing"
import { useFogTuning } from "./useFogTuning"
import { useLensTuning } from "./useLensTuning"
import type { Denoiser } from "./volumetricFog"

const TAKES_OVER_RENDERING = 1

export function useRenderPipeline() {
  const renderer = useThree((state) => state.gl) as unknown as WebGPURenderer
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const fogTuning = useFogTuning()
  const lensTuning = useLensTuning()
  const { enabled, resolutionScale } = fogTuning
  const denoiser = fogTuning.denoiser as Denoiser

  const postProcessing = useMemo(
    () => createPostProcessing(renderer, scene, camera),
    [renderer, scene, camera],
  )

  useEffect(() => postProcessing.dispose, [postProcessing])

  useEffect(
    () => postProcessing.showOutput({ fogEnabled: enabled, denoiser }),
    [postProcessing, enabled, denoiser],
  )

  useEffect(
    () => postProcessing.fog.setResolutionScale(resolutionScale),
    [postProcessing, resolutionScale],
  )

  useEffect(() => {
    const { uniforms } = postProcessing.fog
    uniforms.color.value.set(fogTuning.fogColor)
    uniforms.steps.value = fogTuning.steps
    uniforms.density.value = fogTuning.density
    uniforms.heightFalloff.value = fogTuning.heightFalloff
    uniforms.height.value = fogTuning.fogHeight
    uniforms.cloudScale.value = fogTuning.cloudScale
    uniforms.cloudThreshold.value = fogTuning.cloudThreshold
    uniforms.maxRayDistance.value = fogTuning.maxRayDistance
    uniforms.spatialSigma.value = fogTuning.spatialSigma
    uniforms.depthSensitivity.value = fogTuning.depthSensitivity
    uniforms.blurRadius.value = fogTuning.blurRadius
    uniforms.rangeNear.value = fogTuning.rangeFogNear
    uniforms.rangeFar.value = fogTuning.rangeFogFar
    uniforms.resolutionScale.value = resolutionScale
  })

  useFrame((_, delta) => {
    postProcessing.fog.uniforms.time.value += delta * fogTuning.cloudSpeed
    postProcessing.matchCamera(lensTuning)
    postProcessing.renderPipeline.render()
  }, TAKES_OVER_RENDERING)
}
