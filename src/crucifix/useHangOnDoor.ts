import { useFrame } from "@react-three/fiber"
import { type RefObject, useMemo } from "react"
import { type Group, Matrix4, Quaternion, Vector3 } from "three"
import { doorLeafMatrix } from "@/doorWall/doorWall"
import { hauntState } from "@/haunts/hauntState"
import { loopState } from "@/passage/loopState"
import { type Doorway, doorFrameMatrix } from "@/safeRoom/safeRooms"
import type { CrucifixPlacement } from "./crucifix"

const UP = new Vector3(0, 1, 0)

const leaf = new Matrix4()

const UPSIDE_DOWN = new Matrix4().makeRotationZ(Math.PI)

export function useHangOnDoor(
  group: RefObject<Group>,
  { position, rotationY, scale }: CrucifixPlacement,
  doorway: Doorway,
) {
  const [x, y, z] = position
  const hung = useMemo(
    () =>
      new Matrix4().compose(
        new Vector3(x, y, z),
        new Quaternion().setFromAxisAngle(UP, rotationY),
        new Vector3().setScalar(scale),
      ),
    [x, y, z, rotationY, scale],
  )
  const frame = useMemo(() => doorFrameMatrix(doorway), [doorway])
  const fromClosedLeaf = useMemo(() => doorLeafMatrix(frame, 0).invert(), [frame])

  useFrame(() => {
    doorLeafMatrix(frame, loopState.leafAngles[doorway], leaf)
    group.current.matrix.multiplyMatrices(leaf, fromClosedLeaf).multiply(hung)
    if (hauntState.crucifixInverted) group.current.matrix.multiply(UPSIDE_DOWN)
    group.current.matrixWorldNeedsUpdate = true
  })
}
