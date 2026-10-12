import { useLoader, useThree } from "@react-three/fiber"
import { type Material, Mesh, type Object3D, Texture, type WebGLRenderer } from "three"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js"

const BASIS_TRANSCODER_PATH = "/basis/"

let sharedKTX2Loader: KTX2Loader | null = null

export function useModel(url: string) {
  const renderer = useThree((state) => state.gl)

  return useLoader(GLTFLoader, url, (loader) => {
    loader.setKTX2Loader(ktx2LoaderFor(renderer)).setMeshoptDecoder(MeshoptDecoder)
  })
}

export function releaseModel(url: string, scene: Object3D) {
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return
    object.geometry.dispose()
    const materials: Material[] = Array.isArray(object.material)
      ? object.material
      : [object.material]
    materials.forEach(disposeMaterial)
  })
  useLoader.clear(GLTFLoader, url)
}

export function disposeMaterial(material: Material) {
  for (const value of Object.values(material)) {
    if (value instanceof Texture) value.dispose()
  }
  material.dispose()
}

export function ktx2LoaderFor(renderer: WebGLRenderer) {
  sharedKTX2Loader ??= new KTX2Loader()
    .setTranscoderPath(BASIS_TRANSCODER_PATH)
    .detectSupport(renderer)
  return sharedKTX2Loader
}
