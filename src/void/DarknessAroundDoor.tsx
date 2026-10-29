import { DoubleSide } from "three/webgpu"
import { DARKNESS_AROUND_DOOR, VOID_ROOM_MATRIX } from "./voidSpace"

const DARKNESS_COLOR = "#000000"

export function DarknessAroundDoor() {
  return (
    <group matrix={VOID_ROOM_MATRIX} matrixAutoUpdate={false}>
      {DARKNESS_AROUND_DOOR.map(({ center, size }, index) => (
        <mesh key={index} position={center}>
          <planeGeometry args={size} />
          <meshBasicMaterial color={DARKNESS_COLOR} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}
