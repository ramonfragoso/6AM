import { NOTES } from "./guides"
import { useGuides } from "./useGuides"

export function Guides() {
  const { notes, groups } = useGuides()

  return NOTES.map((note) => (
    <group key={note} ref={groups[note]} matrixAutoUpdate={false}>
      {notes[note].meshes.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
    </group>
  ))
}
