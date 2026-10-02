import { Canvas, extend, type ThreeToJSXElements } from "@react-three/fiber"
import type { ComponentProps } from "react"
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js"
import type { WebGPURendererParameters } from "three/src/renderers/webgpu/WebGPURenderer.js"
import * as THREE from "three/webgpu"

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as any)

type WebGPUCanvasProps = Omit<ComponentProps<typeof Canvas>, "gl">

export function WebGPUCanvas(props: WebGPUCanvasProps) {
  return <Canvas {...props} gl={createRenderer} />
}

async function createRenderer(defaultProps: object) {
  const renderer = new THREE.WebGPURenderer({
    ...(defaultProps as WebGPURendererParameters),
    forceWebGL: !WebGPU.isAvailable(),
  })
  await renderer.init()
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  return renderer
}
