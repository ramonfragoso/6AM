import { type CompressedTexture, LoaderUtils } from "three"
import { type GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js"
import { downloadedBody, markParsed } from "@/loading/downloads"

type Progress = (event: ProgressEvent) => void

type Failure = (error: unknown) => void

export class DownloadedGLTFLoader extends GLTFLoader {
  load(url: string, onLoad: (gltf: GLTF) => void, onProgress?: Progress, onError?: Failure) {
    whenDownloaded(
      url,
      (body) => this.parse(body, LoaderUtils.extractUrlBase(url), parsedThen(url, onLoad), onError),
      () => super.load(url, onLoad, onProgress, onError),
    )
  }
}

export class DownloadedKTX2Loader extends KTX2Loader {
  load(
    url: string,
    onLoad: (texture: CompressedTexture) => void,
    onProgress?: Progress,
    onError?: Failure,
  ) {
    whenDownloaded(
      url,
      (body) => this.parse(body, parsedThen(url, onLoad), onError),
      () => super.load(url, onLoad, onProgress, onError),
    )
  }
}

function parsedThen<Result>(url: string, onLoad: (result: Result) => void) {
  return (result: Result) => {
    markParsed(url)
    onLoad(result)
  }
}

function whenDownloaded(url: string, parse: (body: ArrayBuffer) => void, fetchAgain: () => void) {
  const download = downloadedBody(url)
  if (!download) {
    fetchAgain()
    return
  }
  void download.then((body) => (body ? parse(body) : fetchAgain()))
}
