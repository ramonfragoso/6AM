import { DoubleSide } from "three/webgpu"
import { HOUSE_DOORS } from "./house"
import { useUnderfloorTuning } from "./useUnderfloorTuning"

const UNDERFLOOR_SIZE = 200

const CRUCIFIX_DOOR_LINE_Z = HOUSE_DOORS.end.position[2]

const ENDING_AT_CRUCIFIX_DOOR_Z = CRUCIFIX_DOOR_LINE_Z - UNDERFLOOR_SIZE / 2

const UNDERFLOOR_COLOR = "#000000"

const FACING_UP: [number, number, number] = [-Math.PI / 2, 0, 0]

export function Underfloor() {
  const { depth } = useUnderfloorTuning()

  return (
    <mesh position={[0, -depth, ENDING_AT_CRUCIFIX_DOOR_Z]} rotation={FACING_UP}>
      <planeGeometry args={[UNDERFLOOR_SIZE, UNDERFLOOR_SIZE]} />
      <meshBasicMaterial color={UNDERFLOOR_COLOR} side={DoubleSide} />
    </mesh>
  )
}
