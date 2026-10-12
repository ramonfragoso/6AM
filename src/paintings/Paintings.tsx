import { Suspense } from "react"
import type { CorridorToken } from "@/kit/corridorSpec"
import { KitInstances } from "@/kit/KitInstances"
import type { Kit } from "@/kit/useKit"
import type { HungPainting } from "./paintings"
import { usePaintedCanvases } from "./usePaintedCanvases"
import { useHungPaintings } from "./useHungPaintings"
import type { GlassSettings } from "./usePaintingsTuning"

type PaintingsProps = {
  kit: Kit
  first: CorridorToken[]
  version: string
}

export function Paintings({ kit, first, version }: PaintingsProps) {
  const { hung, frames, glass } = useHungPaintings(kit, first)

  return (
    <>
      <KitInstances kit={kit} placements={frames} />
      <Suspense fallback={null}>
        <PaintedCanvases kit={kit} hung={hung} version={version} glass={glass} />
      </Suspense>
    </>
  )
}

type PaintedCanvasesProps = {
  kit: Kit
  hung: HungPainting[]
  version: string
  glass: GlassSettings
}

function PaintedCanvases({ kit, hung, version, glass }: PaintedCanvasesProps) {
  const meshes = usePaintedCanvases(kit, hung, version, glass)
  return meshes.map((mesh) => <primitive key={mesh.uuid} object={mesh} />)
}
