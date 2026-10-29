import { Color, MathUtils } from "three"
import type { Haunt } from "./haunts"
import { lightsOutSettings } from "./hauntSettings"
import { inSecondCorridor, stepsIn } from "./triggers"

const STEPS_PAST_THE_CORNER = 2

const tint = new Color()

export const LIGHTS_OUT: Haunt = {
  id: "lightsOut",
  name: "Lights Out",
  kind: "loud",
  trigger: stepsIn(inSecondCorridor, STEPS_PAST_THE_CORNER),
  haunt: (state, { sinceManifest }) => {
    const { color, minLight, fadeSeconds, pitch, soundSeconds, firstVolume, secondVolume } =
      lightsOutSettings
    const fade = progress(sinceManifest, fadeSeconds)
    const quiet = progress(sinceManifest - fadeSeconds, soundSeconds)
    state.houseLight = MathUtils.lerp(1, minLight, fade)
    state.houseTint = fade
    state.houseTintColor = tint.set(color).getHex()
    state.ambiencePitch = pitch * fade
    state.firstAmbience = MathUtils.lerp(1, firstVolume, quiet)
    state.secondAmbience = MathUtils.lerp(1, secondVolume, quiet)
  },
}

function progress(elapsed: number, seconds: number) {
  return seconds > 0 ? MathUtils.clamp(elapsed / seconds, 0, 1) : 1
}
