import { useLoader, useThree } from "@react-three/fiber"
import { type Material, Mesh, type Object3D, Texture, type WebGLRenderer } from "three"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { DownloadedGLTFLoader, DownloadedKTX2Loader } from "./downloadedLoaders"

const BASIS_TRANSCODER_PATH = "/basis/"

let sharedKTX2Loader: DownloadedKTX2Loader | null = null

export function useModel(url: string) {
  const renderer = useThree((state) => state.gl)

  return useLoader(DownloadedGLTFLoader, url, (loader) => {
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
  useLoader.clear(DownloadedGLTFLoader, url)
}

export function disposeMaterial(material: Material) {
  for (const value of Object.values(material)) {
    if (value instanceof Texture) value.dispose()
  }
  material.dispose()
}

export function ktx2LoaderFor(renderer: WebGLRenderer) {
  sharedKTX2Loader ??= new DownloadedKTX2Loader()
    .setTranscoderPath(BASIS_TRANSCODER_PATH)
    .detectSupport(renderer)
  return sharedKTX2Loader
}
