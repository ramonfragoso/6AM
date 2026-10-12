import { mix, pass, screenUV, vec4 } from "three/tsl"
import {
  RenderPipeline,
  type PerspectiveCamera,
  type Scene,
  type WebGPURenderer,
} from "three/webgpu"
import { createLens, lensUV, matchLens, type LensSettings } from "./lens"
import { createFog, type Denoiser } from "./volumetricFog"

const LOADING_OUTPUT = vec4(0, 0, 0, 1)

export type PostProcessing = ReturnType<typeof createPostProcessing>

type Output = { fogEnabled: boolean; denoiser: Denoiser }

export function createPostProcessing(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: PerspectiveCamera,
) {
  const scenePass = pass(scene, camera)
  const sceneColor = scenePass.getTextureNode("output")
  const sceneDepth = scenePass.getTextureNode("depth")
  const lens = createLens()
  const fog = createFog(camera, sceneDepth)
  const renderPipeline = new RenderPipeline(renderer, LOADING_OUTPUT)

  const showOutput = ({ fogEnabled, denoiser }: Output) => {
    const uv = lensUV(screenUV, lens)
    const color = sceneColor.sample(uv)
    renderPipeline.outputNode = fogEnabled
      ? vec4(mix(color.rgb, fog.uniforms.color, fog.amountAt(denoiser, uv)), color.a)
      : color
    renderPipeline.needsUpdate = true
  }

  const matchCamera = (settings: LensSettings) => matchLens(lens, camera, settings)

  const dispose = () => {
    renderPipeline.dispose()
    scenePass.dispose()
    fog.dispose()
  }

  return {
    renderPipeline,
    fog,
    lens,
    showOutput,
    matchCamera,
    dispose,
  }
}
