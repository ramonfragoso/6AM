import { type BufferGeometry, type Material, Matrix4, Vector3 } from "three"
import type { Kit, PiecePart } from "@/kit/useKit"
import type { ClutterPose, ClutterSizes, ClutterVariant } from "./clutter"
import { indexedBounds, splitInTwo } from "./splitGeometry"

export type ClutterModel = {
  geometry: BufferGeometry
  material: Material
  poses: Record<ClutterPose, Matrix4>
  size: Vector3
}

export type ClutterModels = Record<ClutterVariant, ClutterModel>

const SOURCE_PIECE = "square_table_set"

const BOOK_MATERIAL = "kit_material__square_table_set__unique"

const DARK_BOTTLE_MATERIAL = "kit_glass_dark__square_table_set"

const GLASS_BOTTLES_MATERIAL = "kit_glass__square_table_set"

const ON_ITS_SIDE = new Matrix4().makeRotationZ(Math.PI / 2)

export function clutterModelsOf(kit: Kit): ClutterModels {
  const glass = partOf(kit, GLASS_BOTTLES_MATERIAL)
  const [first, second] = splitInTwo(glass.geometry)
  const [larger, smaller] =
    indexedBounds(first).getSize(new Vector3()).length() >=
    indexedBounds(second).getSize(new Vector3()).length()
      ? [first, second]
      : [second, first]
  return {
    book: modelOf(partOf(kit, BOOK_MATERIAL)),
    darkBottle: modelOf(partOf(kit, DARK_BOTTLE_MATERIAL)),
    glassBottle: modelOf(glass, larger),
    smallGlassBottle: modelOf(glass, smaller),
  }
}

export function clutterSizesOf(models: ClutterModels): ClutterSizes {
  return {
    book: models.book.size,
    darkBottle: models.darkBottle.size,
    glassBottle: models.glassBottle.size,
    smallGlassBottle: models.smallGlassBottle.size,
  }
}

function partOf(kit: Kit, materialName: string): PiecePart {
  const part = kit[SOURCE_PIECE].parts.find(({ source }) => source.name === materialName)
  if (!part) throw new Error(`The ${SOURCE_PIECE} Piece has no "${materialName}" part`)
  return part
}

function modelOf(part: PiecePart, geometry = part.geometry): ClutterModel {
  const bounds = indexedBounds(geometry).applyMatrix4(part.matrix)
  const center = bounds.getCenter(new Vector3())
  const size = bounds.getSize(new Vector3())
  const centered = new Matrix4()
    .makeTranslation(-center.x, -center.y, -center.z)
    .multiply(part.matrix)
  return {
    geometry,
    material: part.material,
    poses: {
      standing: new Matrix4().makeTranslation(0, size.y / 2, 0).multiply(centered),
      lying: new Matrix4()
        .makeTranslation(0, size.x / 2, 0)
        .multiply(ON_ITS_SIDE)
        .multiply(centered),
    },
    size,
  }
}
