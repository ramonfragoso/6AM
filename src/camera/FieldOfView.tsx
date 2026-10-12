import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import type { PerspectiveCamera } from "three"
import { useCameraTuning } from "./useCameraTuning"

export function FieldOfView() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const { fov } = useCameraTuning()

  useEffect(() => {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }, [camera, fov])

  return null
}
