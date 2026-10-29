import { useFrame } from "@react-three/fiber"
import { useEffect, useState } from "react"
import { hauntState } from "@/haunts/hauntState"
import { clipTilesToTiledArea, TILE_LAYOUTS } from "./floorTiles"
import { tileClip } from "./kitSurface"

const CLIPPED = 1

const UNCLIPPED = 0

export function useFloorTiles() {
  const [turned, setTurned] = useState(hauntState.tilesTurned)
  useEffect(clipTilesToTiledArea, [])
  useFrame(() => {
    if (hauntState.tilesTurned !== turned) setTurned(hauntState.tilesTurned)
    tileClip.enabled.value = turned ? CLIPPED : UNCLIPPED
  })
  return turned ? TILE_LAYOUTS.turned : TILE_LAYOUTS.straight
}
