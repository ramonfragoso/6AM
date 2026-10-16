import type { Vector3 } from "three"
import type { HauntState } from "./hauntState"

export const HAUNT_KINDS = ["loud", "subtle"] as const

export type HauntKind = (typeof HAUNT_KINDS)[number]

export type TriggerMoment = { eye: Vector3; yaw: number; sinceChosen: number }

export type Trigger = (moment: TriggerMoment) => boolean

export type HauntMoment = TriggerMoment & { sinceManifest: number }

export type Haunt = {
  id: string
  name: string
  kind: HauntKind
  trigger?: Trigger
  haunt?: (state: HauntState, moment: HauntMoment) => void
}
