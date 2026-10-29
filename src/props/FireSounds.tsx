import type { FireSoundSpot } from "./flames"
import { useFireSound } from "./useFireSound"
import { type FireSoundSettings, useFireSoundTuning } from "./useFireSoundTuning"

export function FireSounds({ spots }: { spots: FireSoundSpot[] }) {
  const settings = useFireSoundTuning()
  return spots.map((spot, index) => <FireSound key={index} spot={spot} settings={settings} />)
}

type FireSoundProps = { spot: FireSoundSpot; settings: FireSoundSettings }

function FireSound({ spot, settings }: FireSoundProps) {
  const emitterSpot = useFireSound(spot.group, settings)
  return <object3D ref={emitterSpot} position={spot.at} />
}
