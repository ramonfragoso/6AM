import type { Kit } from "@/kit/useKit"
import type { Obstacle } from "./clutter"
import { useClutter } from "./useClutter"

type ClutterProps = { kit: Kit; obstacles: readonly Obstacle[] }

export function Clutter({ kit, obstacles }: ClutterProps) {
  const meshes = useClutter(kit, obstacles)
  return Object.values(meshes).map((mesh) => <primitive key={mesh.uuid} object={mesh} />)
}
