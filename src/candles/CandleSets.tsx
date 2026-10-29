import { Suspense, useMemo } from "react"
import { CANDLE_SET_PIECES } from "@/kit/kitPieces"
import { KitInstances } from "@/kit/KitInstances"
import { usePlacedPieces } from "@/kit/placedPieces"
import type { Kit } from "@/kit/useKit"
import { FireGroup, useFireTexture } from "@/props/Fires"
import { LitFlames } from "@/props/FlameLights"
import { FireSounds } from "@/props/FireSounds"
import { fireSoundSpot, flamePointsOf } from "@/props/flames"
import { furniturePlacement } from "@/props/propPlacements"
import type { FireSettings } from "@/props/useFlamesTuning"
import { candleSetLights } from "./candleSets"
import { useCandleSetsTuning } from "./useCandleSetsTuning"

export function CandleSets({ kit }: { kit: Kit }) {
  const { spots, flame } = useCandleSetsTuning()
  const placements = useMemo(
    () => CANDLE_SET_PIECES.map((piece) => furniturePlacement(piece, spots[piece])),
    [spots],
  )
  usePlacedPieces("candleSets", placements)
  const flames = useMemo(
    () => placements.flatMap((placement) => flamePointsOf(kit, placement)),
    [kit, placements],
  )
  const lights = useMemo(() => candleSetLights(spots, flame.light), [spots, flame.light])
  const sounds = useMemo(() => {
    const spot = fireSoundSpot(kit, placements, "candleSets")
    return spot ? [spot] : []
  }, [kit, placements])

  return (
    <>
      <KitInstances kit={kit} placements={placements} />
      <LitFlames lit={lights} />
      <FireSounds spots={sounds} />
      <Suspense fallback={null}>
        <CandleSetFires flames={flames} settings={flame.fire} />
      </Suspense>
    </>
  )
}

type CandleSetFiresProps = {
  flames: ReturnType<typeof flamePointsOf>
  settings: FireSettings
}

function CandleSetFires({ flames, settings }: CandleSetFiresProps) {
  const texture = useFireTexture()
  return <FireGroup texture={texture} flames={flames} settings={settings} />
}
