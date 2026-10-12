import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import { createDust } from "./dust"
import { readSceneLights } from "./dustLights"
import { useDustTuning } from "./useDustTuning"

export function Dust() {
  const enabled = useDustTuning()
  const { sprite, dispose } = useMemo(createDust, [])

  useEffect(() => dispose, [dispose])
  useFrame(({ scene }) => {
    if (enabled) readSceneLights(scene)
  })

  return <primitive object={sprite} visible={enabled} />
}
