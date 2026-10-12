import { Canvas, extend, type ThreeToJSXElements } from "@react-three/fiber"
import type { ComponentProps } from "react"
import type { WebGPURendererParameters } from "three/src/renderers/webgpu/WebGPURenderer.js"
import * as THREE from "three/webgpu"
import { dropIdentitySwizzle } from "./identitySwizzle"

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as any)

type WebGPUCanvasProps = Omit<ComponentProps<typeof Canvas>, "gl">

type WebGPUNavigator = Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }

export function WebGPUCanvas(props: WebGPUCanvasProps) {
  return <Canvas {...props} gl={createRenderer} />
}

let webGPUSupport: Promise<boolean> | null = null

async function createRenderer(defaultProps: object) {
  dropIdentitySwizzle()
  const renderer = new THREE.WebGPURenderer({
    ...(defaultProps as WebGPURendererParameters),
    alpha: false,
    reversedDepthBuffer: true,
    forceWebGL: !(await supportsWebGPU()),
    antialias: true,
  })
  await renderer.init()
  return renderer
}

function supportsWebGPU() {
  webGPUSupport ??= requestWebGPUAdapter()
  return webGPUSupport
}

async function requestWebGPUAdapter() {
  const adapter = await (navigator as WebGPUNavigator).gpu?.requestAdapter()
  return Boolean(adapter)
}
