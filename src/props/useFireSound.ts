import { useMemo, useRef } from "react"
import type { Object3D } from "three"
import { loopState } from "@/passage/loopState"
import { randomSpread } from "@/sound/shaping"
import { toneOf } from "@/sound/soundSliders"
import { useSoundEmitter } from "@/sound/useSoundEmitter"
import { useSoundLoop } from "@/sound/useSoundLoop"
import type { FireSoundGroup } from "./flames"
import type { FireSoundSettings } from "./useFireSoundTuning"

export function useFireSound(group: FireSoundGroup, settings: FireSoundSettings) {
  const spot = useRef<Object3D>(null)
  const own = useMemo(() => ({ pitch: randomSpread(1), offset: Math.random() }), [])
  const emitter = useSoundEmitter(spot, {
    bus: "ambience",
    shape: settings.shape,
    presence: inHouse,
  })
  const loop = useMemo(
    () => ({
      volume: settings.volume * settings.groups[group],
      pitch: settings.pitch + own.pitch * settings.pitchVariation,
      tone: toneOf(settings.muffle),
    }),
    [settings, group, own],
  )
  useSoundLoop("candle", () => emitter.current?.input ?? null, loop, own.offset)
  return spot
}

function inHouse() {
  return loopState.houseLevel
}
