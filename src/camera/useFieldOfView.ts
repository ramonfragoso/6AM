import { useFrame, useThree } from "@react-three/fiber"
import type { PerspectiveCamera } from "three"
import { cameraZoom, zoomedFov } from "@/zoom/zoom"
import { useCameraTuning } from "./useCameraTuning"

export function useFieldOfView() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const { fov } = useCameraTuning()

  useFrame(() => {
    const zoomed = zoomedFov(fov, cameraZoom.magnification)
    if (camera.fov === zoomed) return
    camera.fov = zoomed
    camera.updateProjectionMatrix()
  })
}
