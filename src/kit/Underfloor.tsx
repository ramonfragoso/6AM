import { DoubleSide } from "three/webgpu"
import { useUnderfloorTuning } from "./useUnderfloorTuning"

const UNDERFLOOR_SIZE = 200

const UNDERFLOOR_COLOR = "#000000"

const FACING_UP: [number, number, number] = [-Math.PI / 2, 0, 0]

export function Underfloor() {
  const { depth } = useUnderfloorTuning()

  return (
    <mesh position={[0, -depth, 0]} rotation={FACING_UP}>
      <planeGeometry args={[UNDERFLOOR_SIZE, UNDERFLOOR_SIZE]} />
      <meshBasicMaterial color={UNDERFLOOR_COLOR} side={DoubleSide} />
    </mesh>
  )
}
