export type HauntState = { houseLight: number }

export const CLEAN_HAUNT_STATE: Readonly<HauntState> = { houseLight: 1 }

export const hauntState: HauntState = { ...CLEAN_HAUNT_STATE }

export function resetHauntState() {
  Object.assign(hauntState, CLEAN_HAUNT_STATE)
}
