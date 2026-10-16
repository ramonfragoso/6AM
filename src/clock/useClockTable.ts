import type { RapierRigidBody } from "@react-three/rapier"
import { useMemo, useRef } from "react"
import type { Group } from "three"
import type { Kit } from "@/kit/useKit"
import { furnishedPose } from "@/safeRoom/furnishedRoom"
import { useFurnished } from "@/safeRoom/useFurnished"
import { useFurnitureShadow } from "@/safeRoom/useFurnitureShadow"
import { clockOnTableMatrix, tableCollider, tableMatrix } from "./clock"
import { useClockHands } from "./useClockHands"
import { useClockModel } from "./useClockModel"
import { useClockSounds } from "./useClockSounds"
import { useClockSoundTuning } from "./useClockSoundTuning"
import { useClockTuning } from "./useClockTuning"

export function useClockTable(kit: Kit) {
  const model = useClockModel(kit)
  const { table: tableSpot, clock: clockSpot } = useClockTuning()
  const table = useRef<Group>(null!)
  const clock = useRef<Group>(null)
  const body = useRef<RapierRigidBody>(null)
  const local = useMemo(() => tableMatrix(tableSpot), [tableSpot])
  const onTable = useMemo(
    () => clockOnTableMatrix(clockSpot, model.tableBounds.max.y),
    [clockSpot, model.tableBounds],
  )
  const collider = useMemo(
    () => tableCollider(model.tableBounds, tableSpot.size),
    [model.tableBounds, tableSpot.size],
  )
  const bodyPose = useMemo(() => furnishedPose(local), [local])
  useFurnished(table, body, local)
  useFurnitureShadow(model.shadowCasters)
  const handRefs = useClockHands(model.hands)
  useClockSounds(clock, useClockSoundTuning())

  return {
    model,
    table,
    clock,
    body,
    onTable,
    collider,
    bodyPose,
    handRefs,
  }
}
