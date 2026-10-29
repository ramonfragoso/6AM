import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { type AmbientLight, Color } from "three"
import { hauntLight } from "@/haunts/hauntedLight"
import { useWorldTuning } from "./useWorldTuning"

const AMBIENT_COLOR = "#ffffff"

export function Lights() {
  const { lighting } = useWorldTuning()
  const ambient = useRef<AmbientLight>(null!)
  const color = useMemo(() => new Color(AMBIENT_COLOR), [])
  useFrame(() => hauntLight(ambient.current, lighting.ambientIntensity, color))
  return <ambientLight ref={ambient} intensity={lighting.ambientIntensity} color={color} />
}
