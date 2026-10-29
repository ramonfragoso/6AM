import { useFrame } from "@react-three/fiber"
import { useMemo } from "react"
import { InstancedMesh, Matrix4 } from "three"
import { placementMatrix } from "@/kit/KitInstances"
import type { Placement } from "@/kit/kitPieces"
import type { Kit, PiecePart } from "@/kit/useKit"
import { useDisposeWhenDropped } from "@/safeRoom/useDisposeWhenDropped"
import { voidOpen } from "./voidOpen"
import { VOID_PLACEMENTS } from "./voidSpace"

type PieceInstances = { part: PiecePart; mesh: InstancedMesh; placements: Placement[] }

type VoidPieces = { instances: PieceInstances[]; placedOpen: boolean | null }

const HIDDEN = new Matrix4().makeScale(0, 0, 0)

export function useVoidPieces(kit: Kit) {
  const pieces = useMemo<VoidPieces>(
    () => ({ instances: pieceInstancesOf(kit), placedOpen: null }),
    [kit],
  )

  useDisposeWhenDropped(pieces, disposePieces)
  useFrame(() => {
    const open = voidOpen()
    if (pieces.placedOpen === open) return
    pieces.placedOpen = open
    for (const instances of pieces.instances) placePieces(instances, open)
  })

  return useMemo(() => pieces.instances.map(({ mesh }) => mesh), [pieces])
}

function pieceInstancesOf(kit: Kit) {
  return [...Map.groupBy(VOID_PLACEMENTS, ({ piece }) => piece)].flatMap(([piece, placements]) =>
    kit[piece].parts.map((part) => {
      const mesh = new InstancedMesh(part.geometry, part.material, placements.length)
      mesh.receiveShadow = true
      mesh.frustumCulled = false
      const instances = { part, mesh, placements }
      placePieces(instances, false)
      return instances
    }),
  )
}

function placePieces({ part, mesh, placements }: PieceInstances, open: boolean) {
  placements.forEach((placement, index) => {
    mesh.setMatrixAt(index, open ? placementMatrix(placement).multiply(part.matrix) : HIDDEN)
  })
  mesh.instanceMatrix.needsUpdate = true
}

function disposePieces({ instances }: VoidPieces) {
  for (const { mesh } of instances) mesh.dispose()
}
