import { type Box3, Matrix4, Vector3 } from "three"
import { HAUNTS } from "@/haunts/allHaunts"
import { nightSession, unfoundHaunts } from "@/night/night"
import { loopState } from "@/passage/loopState"

export const GUIDES_URL = "/models/guides.glb"

export const NOTES = ["guide", "hauntCount"] as const

export type Note = (typeof NOTES)[number]

export const NOTE_PIECES = ["guide", "guide_small"] as const

export type NotePiece = (typeof NOTE_PIECES)[number]

export const PIECE_OF_NOTE: Record<Note, NotePiece> = { guide: "guide", hauntCount: "guide_small" }

const NOTE_TEXTURES_URL = "/models/paintings"

export const GUIDE_TEXTURE_URL = `${NOTE_TEXTURES_URL}/guide.ktx2`

export const HAUNT_COUNT_TEXTURE_URLS = HAUNTS.map(
  (_, index) => `${NOTE_TEXTURES_URL}/haunts_left_${index + 1}.ktx2`,
)

export type NoteSpot = {
  along: number
  height: number
  out: number
  size: number
}

export const GUIDE_SPOT: NoteSpot = {
  along: 1.55,
  height: 1.8,
  out: 0,
  size: 1,
}

export const HAUNT_COUNT_SPOT: NoteSpot = {
  along: -1.55,
  height: 1.8,
  out: 0,
  size: 1,
}

const DOORWAY_WALL_FACE = 1.95

const FACING_INTO_ROOM = new Matrix4().makeRotationY(Math.PI)

const HIDDEN_SCALE = new Matrix4().makeScale(0, 0, 0)

export function noteMatrix({ along, height, out, size }: NoteSpot, bounds: Box3) {
  const center = bounds.getCenter(new Vector3())
  return new Matrix4()
    .makeTranslation(-along, height, DOORWAY_WALL_FACE - out)
    .multiply(FACING_INTO_ROOM)
    .multiply(new Matrix4().makeScale(size, size, size))
    .multiply(new Matrix4().makeTranslation(-center.x, -center.y, 0))
}

export function noteFront(bounds: Box3) {
  const center = bounds.getCenter(new Vector3())
  return new Vector3(center.x, center.y, bounds.max.z)
}

export function shownMatrix(matrix: Matrix4, shown: boolean) {
  return shown ? matrix : matrix.clone().multiply(HIDDEN_SCALE)
}

export function noteShown(note: Note) {
  if (note === "hauntCount") return nightSession.nightsWon > 0 && hauntsLeft() > 0
  return nightSession.loopsEnded > 0 || enteringRoom()
}

export function hauntsLeft() {
  return Math.min(unfoundHaunts(enteringRoom()), HAUNT_COUNT_TEXTURE_URLS.length)
}

function enteringRoom() {
  return loopState.passing && loopState.whereabouts === "house"
}
