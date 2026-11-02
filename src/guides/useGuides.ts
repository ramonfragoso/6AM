import { useFrame, useLoader, useThree } from "@react-three/fiber"
import { type RefObject, useEffect, useMemo, useRef } from "react"
import { type Group, type Material, Matrix4, Mesh, type Texture } from "three"
import { type PieceModel, pieceModelsOf } from "@/kit/useKit"
import { ktx2LoaderFor, useModel } from "@/models/useModel"
import { furnishedRoomMatrix } from "@/safeRoom/furnishedRoom"
import { ROOM_SURFACE } from "@/safeRoom/useSafeRoomModel"
import { FURNISH_PRIORITY } from "@/world/physicsSettings"
import {
  GUIDE_TEXTURE_URL,
  GUIDES_URL,
  HAUNT_COUNT_TEXTURE_URLS,
  hauntsLeft,
  type Note,
  NOTE_PIECES,
  noteFront,
  noteMatrix,
  NOTES,
  noteShown,
  PIECE_OF_NOTE,
  shownMatrix,
} from "./guides"
import { noteReading } from "./noteReading"
import { useGuidesTuning } from "./useGuidesTuning"

const ANISOTROPY = 8

const TEXTURE_URLS = [GUIDE_TEXTURE_URL, ...HAUNT_COUNT_TEXTURE_URLS]

const INTO_ROOM = 1

type NoteModel = {
  meshes: Mesh[]
  canvas: Mesh | null
  papers: Material[]
  piece: PieceModel
}

type Placed = {
  room: Matrix4
  local: Matrix4
  shown: boolean
  paper: number
}

export function useGuides() {
  const notes = useNoteModels()
  const spots = useGuidesTuning()
  const locals = useMemo(
    () => ({
      guide: noteMatrix(spots.guide, notes.guide.piece.bounds),
      hauntCount: noteMatrix(spots.hauntCount, notes.hauntCount.piece.bounds),
    }),
    [spots, notes],
  )
  const groups = {
    guide: useRef<Group>(null),
    hauntCount: useRef<Group>(null),
  }
  const placed = useRef<Partial<Record<Note, Placed>>>({})

  useFrame(() => {
    for (const note of NOTES) {
      const now = {
        room: furnishedRoomMatrix(),
        local: locals[note],
        shown: noteShown(note),
        paper: note === "hauntCount" ? hauntsLeft() - 1 : 0,
      }
      const before = placed.current[note]
      if (before && samePlacement(before, now)) continue
      placed.current[note] = now
      place(note, now, notes[note], groups[note])
    }
  }, FURNISH_PRIORITY)

  useEffect(
    () => () => {
      for (const note of NOTES) noteReading.fronts[note] = null
    },
    [],
  )

  return { notes, groups }
}

function place(note: Note, now: Placed, model: NoteModel, group: RefObject<Group | null>) {
  const world = now.room.clone().multiply(now.local)
  const paper = model.papers[Math.max(now.paper, 0)]
  if (model.canvas && paper) model.canvas.material = paper
  noteReading.fronts[note] = now.shown ? noteFront(model.piece.bounds).applyMatrix4(world) : null
  noteReading.facings[note].set(0, 0, INTO_ROOM).transformDirection(world)
  const target = group.current
  if (!target) return
  target.matrix.copy(shownMatrix(world, now.shown))
  target.matrixWorldNeedsUpdate = true
}

function samePlacement(a: Placed, b: Placed) {
  return a.room === b.room && a.local === b.local && a.shown === b.shown && a.paper === b.paper
}

function useNoteModels(): Record<Note, NoteModel> {
  const { scene } = useModel(GUIDES_URL)
  const renderer = useThree((state) => state.gl)
  const textures = useLoader(ktx2LoaderFor(renderer), TEXTURE_URLS)
  const models = useMemo(() => {
    textures.forEach((texture) => (texture.anisotropy = ANISOTROPY))
    const pieces = pieceModelsOf(scene, NOTE_PIECES, ROOM_SURFACE)
    const [guidePaper, ...hauntCountPapers] = textures
    return {
      guide: noteModel(pieces[PIECE_OF_NOTE.guide], [guidePaper]),
      hauntCount: noteModel(pieces[PIECE_OF_NOTE.hauntCount], hauntCountPapers),
    }
  }, [scene, textures])

  useEffect(
    () => () => {
      for (const note of NOTES) models[note].papers.forEach((paper) => paper.dispose())
    },
    [models],
  )

  return models
}

function noteModel(piece: PieceModel, papers: Texture[]): NoteModel {
  const meshes = piece.parts.map(({ geometry, material, matrix }) => {
    const mesh = new Mesh(geometry, material)
    mesh.matrixAutoUpdate = false
    mesh.matrix.copy(matrix)
    mesh.receiveShadow = true
    return mesh
  })
  const canvasIndex = piece.parts.findIndex((part) => part.canvas)
  const canvas = meshes[canvasIndex] ?? null
  const blank = piece.parts[canvasIndex]?.material
  const painted = blank ? papers.map((paper) => Object.assign(blank.clone(), { map: paper })) : []
  if (canvas && painted[0]) canvas.material = painted[0]
  return {
    meshes,
    canvas,
    papers: painted,
    piece,
  }
}
