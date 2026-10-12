import { useLoader, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import type { Texture } from "three"
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js"
import { ktx2LoaderFor } from "@/models/useModel"
import { PAINTING_NAMES, type PaintingName, paintingUrl } from "./paintings"

const ANISOTROPY = 8

export type PaintingTextures = Record<PaintingName, Texture>

type LoadedTextures = { urls: string[]; textures: Texture[] }

export function usePaintingTextures(version: string): PaintingTextures {
  const renderer = useThree((state) => state.gl)
  const loader = ktx2LoaderFor(renderer)
  const urls = useMemo(() => PAINTING_NAMES.map((name) => paintingUrl(name, version)), [version])
  const textures = useLoader(loader, urls)
  useReleaseReplacedTextures(loader, urls, textures)

  return useMemo(() => {
    textures.forEach((texture) => (texture.anisotropy = ANISOTROPY))
    return Object.fromEntries(
      PAINTING_NAMES.map((name, index): [PaintingName, Texture] => [name, textures[index]]),
    ) as PaintingTextures
  }, [textures])
}

function useReleaseReplacedTextures(loader: KTX2Loader, urls: string[], textures: Texture[]) {
  const current = useRef<LoadedTextures | null>(null)

  useEffect(() => {
    const previous = current.current
    current.current = { urls, textures }
    if (!previous || previous.urls[0] === urls[0]) return
    previous.textures.forEach((texture) => texture.dispose())
    useLoader.clear(loader, previous.urls)
  }, [loader, urls, textures])
}
