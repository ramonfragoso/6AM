import { useFrame, useThree } from "@react-three/fiber"
import { dawnScreenCover } from "@/dawn/dawnScreenCover"
import { useEffect, useMemo } from "react"
import type { PerspectiveCamera, WebGPURenderer } from "three/webgpu"
import { hauntState } from "@/haunts/hauntState"
import { drawsScene } from "@/loading/loading"
import { cameraZoom, withFarFocus } from "@/zoom/zoom"
import { createPostProcessing } from "./postProcessing"
import { useBloomTuning } from "./useBloomTuning"
import { useChromaticAberrationTuning } from "./useChromaticAberrationTuning"
import { useDepthOfFieldTuning, useFocusTuning } from "./useDepthOfFieldTuning"
import { useFogTuning } from "./useFogTuning"
import { useLensTuning } from "./useLensTuning"
import { useVignetteTuning } from "./useVignetteTuning"
import type { Denoiser } from "./volumetricFog"

const TAKES_OVER_RENDERING = 1

export function useRenderPipeline() {
  const renderer = useThree((state) => state.gl) as unknown as WebGPURenderer
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const fogTuning = useFogTuning()
  const lensTuning = useLensTuning()
  const depthOfFieldTuning = useDepthOfFieldTuning()
  const focusTuning = useFocusTuning()
  const bloomTuning = useBloomTuning()
  const chromaticAberrationTuning = useChromaticAberrationTuning()
  const vignetteTuning = useVignetteTuning()
  const { enabled, resolutionScale } = fogTuning
  const denoiser = fogTuning.denoiser as Denoiser
  const depthOfFieldEnabled = depthOfFieldTuning.enabled
  const bloomEnabled = bloomTuning.enabled
  const chromaticAberrationEnabled = chromaticAberrationTuning.enabled
  const vignetteEnabled = vignetteTuning.enabled

  const postProcessing = useMemo(
    () => createPostProcessing(renderer, scene, camera),
    [renderer, scene, camera],
  )

  useEffect(() => postProcessing.dispose, [postProcessing])

  useEffect(
    () =>
      postProcessing.showOutput({
        fogEnabled: enabled,
        denoiser,
        depthOfFieldEnabled,
        bloomEnabled,
        chromaticAberrationEnabled,
        vignetteEnabled,
      }),
    [
      postProcessing,
      enabled,
      denoiser,
      depthOfFieldEnabled,
      bloomEnabled,
      chromaticAberrationEnabled,
      vignetteEnabled,
    ],
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

    postProcessing.depthOfField.focalLength.value = depthOfFieldTuning.focalLength
    postProcessing.bloom.radius.value = bloomTuning.radius
    postProcessing.bloom.threshold.value = bloomTuning.threshold
    postProcessing.bloom.smoothWidth.value = bloomTuning.smoothWidth
    postProcessing.chromaticAberration.scale.value = chromaticAberrationTuning.scale
    postProcessing.vignette.radius.value = vignetteTuning.radius
    postProcessing.vignette.softness.value = vignetteTuning.softness
    postProcessing.vignette.roundness.value = vignetteTuning.roundness
  })

  useFrame((_, delta) => {
    if (dawnScreenCover.coversScene || !drawsScene()) return
    postProcessing.fog.uniforms.time.value += delta * fogTuning.cloudSpeed
    postProcessing.depthOfField.bokehScale.value =
      depthOfFieldTuning.bokehScale * hauntState.depthOfField
    postProcessing.bloom.strength.value = bloomTuning.strength * hauntState.bloom
    postProcessing.chromaticAberration.strength.value =
      chromaticAberrationTuning.strength * hauntState.chromaticAberration
    postProcessing.vignette.strength.value = vignetteTuning.strength * hauntState.vignette
    postProcessing.matchCamera(lensTuning)
    if (depthOfFieldEnabled) {
      const focusSettings = withFarFocus(focusTuning, cameraZoom.farFocus)
      postProcessing.focus.update(renderer, delta, focusSettings)
    }
    postProcessing.renderPipeline.render()
  }, TAKES_OVER_RENDERING)
}
