import { useFloorTiles } from "./useFloorTiles"
import { KitInstances } from "./KitInstances"
import type { Kit } from "./useKit"

export function FloorTiles({ kit }: { kit: Kit }) {
  const placements = useFloorTiles()
  return <KitInstances kit={kit} placements={placements} />
}
