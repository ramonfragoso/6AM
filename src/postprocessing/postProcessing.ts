import { bloom } from "three/addons/tsl/display/BloomNode.js"
import { dof } from "three/addons/tsl/display/DepthOfFieldNode.js"
import { mix, pass, passTexture, rtt, screenUV, uniform, vec4 } from "three/tsl"
import {
  RenderPipeline,
  type PerspectiveCamera,
  type Scene,
  type TextureNode,
  type WebGPURenderer,
} from "three/webgpu"
import {
  BLUE_INWARD,
  channelUV,
  createChromaticAberration,
  RED_OUTWARD,
} from "./chromaticAberration"
import { createFocus } from "./focus"
import { createLens, lensUV, matchLens, type LensSettings } from "./lens"
import { createVignette, vignetteShade } from "./vignette"
import { createFog, type Denoiser } from "./volumetricFog"

const LOADING_OUTPUT = vec4(0, 0, 0, 1)

export type PostProcessing = ReturnType<typeof createPostProcessing>

export type Output = {
  fogEnabled: boolean
  denoiser: Denoiser
  depthOfFieldEnabled: boolean
  bloomEnabled: boolean
  chromaticAberrationEnabled: boolean
  vignetteEnabled: boolean
}

type Disposable = { dispose(): void }

type TextureOutput = { getTextureNode(): TextureNode }

export function createPostProcessing(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: PerspectiveCamera,
) {
  const scenePass = pass(scene, camera)
  const sceneColor = scenePass.getTextureNode("output")
  const sceneDepth = scenePass.getTextureNode("depth")
  const sceneViewZ = scenePass.getViewZNode()
  const lens = createLens()
  const fog = createFog(camera, sceneDepth)
  const focus = createFocus(camera, sceneDepth)
  const depthOfField = createDepthOfFieldUniforms()
  const glow = createBloomUniforms()
  const chromaticAberration = createChromaticAberration()
  const vignette = createVignette()
  const renderPipeline = new RenderPipeline(renderer, LOADING_OUTPUT)
  let effectNodes: Disposable[] = []

  const showOutput = (output: Output) => {
    disposeAll(effectNodes)
    effectNodes = []
    const keep = <T extends Disposable>(node: T) => {
      effectNodes.push(node)
      return node
    }

    const fogAmount = fog.amountAt(output.denoiser, screenUV)
    const foggedColor = mix(sceneColor.sample(screenUV).rgb, fog.uniforms.color, fogAmount)
    const fogged = output.fogEnabled ? keep(rtt(vec4(foggedColor, 1))) : sceneColor

    const focused = output.depthOfFieldEnabled
      ? keep(
          dof(
            fogged,
            sceneViewZ,
            focus.distance,
            depthOfField.focalLength,
            depthOfField.bokehScale,
          ),
        )
      : null
    const picture = focused
      ? passTexture(focused as any, textureOutputOf(focused).getTextureNode().value)
      : (fogged as any)

    const bloomed = output.bloomEnabled
      ? keep(bloom(picture, glow.strength, glow.radius, glow.threshold))
      : null
    if (bloomed) bloomed.smoothWidth = glow.smoothWidth
    const glowTexture = bloomed && textureOutputOf(bloomed).getTextureNode()

    const colorAt = (uv: any) => {
      const lensed = lensUV(uv, lens)
      const color = picture.sample(lensed).rgb
      return glowTexture ? color.add(glowTexture.sample(lensed).rgb) : color
    }

    const color = output.chromaticAberrationEnabled
      ? vec4(
          colorAt(channelUV(screenUV, chromaticAberration, RED_OUTWARD)).r,
          colorAt(screenUV).g,
          colorAt(channelUV(screenUV, chromaticAberration, BLUE_INWARD)).b,
          1,
        )
      : vec4(colorAt(screenUV), 1)

    renderPipeline.outputNode = output.vignetteEnabled
      ? vec4(color.rgb.mul(vignetteShade(screenUV, vignette)), 1)
      : color
    renderPipeline.needsUpdate = true
  }

  const matchCamera = (settings: LensSettings) => {
    matchLens(lens, camera, settings)
    vignette.aspect.value = camera.aspect
  }

  const dispose = () => {
    disposeAll(effectNodes)
    renderPipeline.dispose()
    scenePass.dispose()
    fog.dispose()
    focus.dispose()
  }

  return {
    renderPipeline,
    fog,
    lens,
    focus,
    depthOfField,
    bloom: glow,
    chromaticAberration,
    vignette,
    showOutput,
    matchCamera,
    dispose,
  }
}

function createDepthOfFieldUniforms() {
  return {
    focalLength: uniform(1),
    bokehScale: uniform(1),
  }
}

function createBloomUniforms() {
  return {
    strength: uniform(0),
    radius: uniform(0),
    threshold: uniform(1),
    smoothWidth: uniform(0),
  }
}

function textureOutputOf(node: unknown) {
  return node as TextureOutput
}

function disposeAll(nodes: Disposable[]) {
  nodes.forEach((node) => node.dispose())
}
