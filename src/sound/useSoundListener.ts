import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { Matrix4, Vector3 } from "three"
import { audioEngine } from "./audioEngine"

const position = new Vector3()

const forward = new Vector3()

const up = new Vector3()

export function useSoundListener() {
  const heard = useRef(new Matrix4())

  useFrame(({ camera }) => {
    const engine = audioEngine()
    if (!engine || camera.matrixWorld.equals(heard.current)) return
    heard.current.copy(camera.matrixWorld)
    position.setFromMatrixPosition(camera.matrixWorld)
    forward.set(0, 0, -1).transformDirection(camera.matrixWorld)
    up.set(0, 1, 0).transformDirection(camera.matrixWorld)
    const { listener } = engine.context
    if (!listener.positionX) {
      listener.setPosition(position.x, position.y, position.z)
      listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z)
      return
    }
    listener.positionX.value = position.x
    listener.positionY.value = position.y
    listener.positionZ.value = position.z
    listener.forwardX.value = forward.x
    listener.forwardY.value = forward.y
    listener.forwardZ.value = forward.z
    listener.upX.value = up.x
    listener.upY.value = up.y
    listener.upZ.value = up.z
  })
}
