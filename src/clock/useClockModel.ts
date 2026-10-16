import { useMemo } from "react"
import { type Matrix4, Mesh } from "three"
import { kitTexturesOf } from "@/doorWall/doorWall"
import { type Kit, type PieceModel, pieceModelsOf } from "@/kit/useKit"
import { useModel } from "@/models/useModel"
import { shadeFromLamp } from "@/safeRoom/lampShadow"
import { ROOM_SURFACE } from "@/safeRoom/useSafeRoomModel"
import { CLOCK_PIECES, CLOCK_URL, HAND_ANCHORS, HAND_PIECES, type Hand, HANDS } from "./clock"

export type ClockHand = { anchor: Matrix4; meshes: Mesh[] }

export type ClockModel = {
  table: Mesh[]
  clock: Mesh[]
  shadowCasters: Mesh[]
  hands: Record<Hand, ClockHand>
  tableBounds: PieceModel["bounds"]
}

export function useClockModel(kit: Kit): ClockModel {
  const { scene } = useModel(CLOCK_URL)
  const texturesFor = useMemo(() => kitTexturesOf(kit), [kit])
  return useMemo(() => {
    const pieces = pieceModelsOf(scene, CLOCK_PIECES, { ...ROOM_SURFACE, texturesFor })
    for (const { parts } of Object.values(pieces)) {
      for (const { material } of parts) shadeFromLamp(material, null)
    }
    const table = meshesOf(pieces.round_table)
    const body = meshesOf(pieces.clock)
    const handOf = (hand: Hand): ClockHand => ({
      anchor: anchorOf(pieces.clock, HAND_ANCHORS[hand]),
      meshes: meshesOf(pieces[HAND_PIECES[hand]]),
    })
    return {
      table,
      clock: [...body, ...meshesOf(pieces.clock_glass)],
      shadowCasters: [...table, ...body],
      hands: Object.fromEntries(HANDS.map((hand) => [hand, handOf(hand)])) as Record<
        Hand,
        ClockHand
      >,
      tableBounds: pieces.round_table.bounds,
    }
  }, [scene, texturesFor])
}

function meshesOf({ parts }: PieceModel) {
  return parts.map(({ geometry, material, matrix }) => {
    const mesh = new Mesh(geometry, material)
    mesh.matrixAutoUpdate = false
    mesh.matrix.copy(matrix)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  })
}

function anchorOf({ anchors }: PieceModel, name: string) {
  const anchor = anchors.find((candidate) => candidate.name === name)
  if (!anchor) throw new Error(`${CLOCK_URL} has no "${name}" Anchor; export the clock again`)
  return anchor.matrix
}
