import { useWorldTuning } from "./useWorldTuning"

export function Lights() {
  const { lighting } = useWorldTuning()
  return <ambientLight intensity={lighting.ambientIntensity} />
}
