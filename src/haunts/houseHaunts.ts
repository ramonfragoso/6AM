import type { Haunt } from "./haunts"

export const INVERTED_CROSS: Haunt = {
  id: "invertedCross",
  name: "Inverted Cross",
  kind: "loud",
  haunt: (state) => {
    state.crucifixInverted = true
  },
}

export const MISSING_COAT_AND_HAT: Haunt = {
  id: "missingCoatAndHat",
  name: "Missing Coat and Hat",
  kind: "subtle",
  haunt: (state) => {
    state.coatRackBare = true
  },
}

export const TILED_FLOOR_ROTATION: Haunt = {
  id: "tiledFloorRotation",
  name: "Tiled Floor Rotation",
  kind: "subtle",
  haunt: (state) => {
    state.tilesTurned = true
  },
}

export const MANY_BOOKS_AND_BOTTLES: Haunt = {
  id: "manyBooksAndBottles",
  name: "Many Books and Bottles",
  kind: "loud",
  haunt: (state) => {
    state.clutterSeed ??= Math.random()
  },
}
