import { useEffect, useLayoutEffect, useMemo } from "react"
import { Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from "three"
import { castsShadow, type KitPiece, type Placement } from "./kitPieces"
import type { Kit, PiecePart } from "./useKit"

const NO_TILT = [0, 0] as const

const YAW_FIRST = "YXZ"

const UNIT_SCALE = 1

type PieceCount = { piece: KitPiece; count: number }

type PartInstances = { piece: KitPiece; part: PiecePart; mesh: InstancedMesh }

export function KitInstances({ kit, placements }: { kit: Kit; placements: Placement[] }) {
  const counts = usePieceCounts(placements)
  const instances = useMemo(() => partInstances(kit, counts), [kit, counts])

  useLayoutEffect(() => placeInstances(instances, placements), [instances, placements])
  useEffect(() => () => instances.forEach(({ mesh }) => mesh.dispose()), [instances])

  return instances.map(({ mesh }) => <primitive key={mesh.uuid} object={mesh} />)
}

export function placementMatrix({
  position,
  rotationY,
  tilt = NO_TILT,
  scale = UNIT_SCALE,
}: Placement) {
  const rotation = new Quaternion().setFromEuler(new Euler(tilt[0], rotationY, tilt[1], YAW_FIRST))
  return new Matrix4().compose(new Vector3(...position), rotation, new Vector3().setScalar(scale))
}

function usePieceCounts(placements: Placement[]) {
  const key = [...Map.groupBy(placements, (placement) => placement.piece)]
    .map(([piece, piecePlacements]) => `${piece}:${piecePlacements.length}`)
    .join(" ")
  return useMemo(() => pieceCountsOf(key), [key])
}

function pieceCountsOf(key: string): PieceCount[] {
  return key
    .split(" ")
    .filter(Boolean)
    .map((entry) => {
      const [piece, count] = entry.split(":")
      return { piece: piece as KitPiece, count: Number(count) }
    })
}

function partInstances(kit: Kit, counts: PieceCount[]): PartInstances[] {
  return counts.flatMap(({ piece, count }) =>
    kit[piece].parts
      .filter((part) => !part.canvas)
      .map((part) => {
        const mesh = new InstancedMesh(part.geometry, part.material, count)
        mesh.castShadow = castsShadow(piece) && !part.material.transparent
        mesh.receiveShadow = true
        return { piece, part, mesh }
      }),
  )
}

function placeInstances(instances: PartInstances[], placements: Placement[]) {
  const byPiece = Map.groupBy(placements, (placement) => placement.piece)
  for (const { piece, part, mesh } of instances) {
    byPiece.get(piece)?.forEach((placement, index) => {
      mesh.setMatrixAt(index, placementMatrix(placement).multiply(part.matrix))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }
}
