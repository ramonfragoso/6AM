import { Canvas, extend, type ThreeToJSXElements } from "@react-three/fiber"
import type { ComponentProps } from "react"
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
    alpha: false,
    reversedDepthBuffer: true,
  })
  await renderer.init()
  return renderer
}
