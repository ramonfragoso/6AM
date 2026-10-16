import { CylinderCollider, RigidBody } from "@react-three/rapier"
import type { Kit } from "@/kit/useKit"
import { HANDS } from "./clock"
import { useClockTable } from "./useClockTable"

export function ClockTable({ kit }: { kit: Kit }) {
  const { model, table, clock, body, onTable, collider, bodyPose, handRefs } = useClockTable(kit)

  return (
    <>
      <group ref={table} matrixAutoUpdate={false}>
        {model.table.map((mesh) => (
          <primitive key={mesh.uuid} object={mesh} />
        ))}
        <group ref={clock} matrix={onTable} matrixAutoUpdate={false}>
          {model.clock.map((mesh) => (
            <primitive key={mesh.uuid} object={mesh} />
          ))}
          {HANDS.map((hand) => (
            <group key={hand} ref={handRefs[hand]} matrixAutoUpdate={false}>
              {model.hands[hand].meshes.map((mesh) => (
                <primitive key={mesh.uuid} object={mesh} />
              ))}
            </group>
          ))}
        </group>
      </group>
      <RigidBody
        key={JSON.stringify(collider)}
        ref={body}
        type="fixed"
        colliders={false}
        {...bodyPose}
      >
        <CylinderCollider args={collider.args} position={collider.position} />
      </RigidBody>
    </>
  )
}
