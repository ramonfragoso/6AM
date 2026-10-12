import { useEffect } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { DUST_PARTICLES, dust } from "./dust"

const MILLIMETERS_PER_METER = 1000

export function useDustTuning() {
  const tuning = useTuningControls(
    "Dust",
    {
      enabled: true,
      color: "#ffffff",
      amount: slider(
        0.6,
        0,
        1,
        0.01,
        `Share of the ${DUST_PARTICLES} dust particles that are shown`,
      ),
      size: slider(6, 0.5, 20, 0.1, "Size of a speck, in millimeters"),
      minPixels: slider(
        2,
        0.5,
        4,
        0.1,
        "Far specks never draw smaller than this; they fade instead",
      ),
      maxPixels: slider(6, 1, 30, 0.5, "Near specks never draw larger than this, in pixels"),
      opacity: slider(1.2, 0, 2, 0.01, "Overall brightness of the dust"),
      alphaVariation: slider(0.8, 0, 1, 0.01, "How much brightness differs from speck to speck"),
      twinkle: slider(0.5, 0, 1, 0.01, "How much each speck pulses over time"),
      twinkleSpeed: slider(0.6, 0, 5, 0.01, "How fast the specks pulse"),
      softness: slider(
        0.6,
        0.05,
        1,
        0.01,
        "Edge of each speck: low is a hard dot, high a soft glow",
      ),
      drift: slider(0.25, 0, 2, 0.01, "How far each speck wanders around its spot, in meters"),
      driftSpeed: slider(0.08, 0, 1, 0.005, "How fast the specks wander"),
      fall: slider(0.01, -0.1, 0.1, 0.001, "Meters per second the dust sinks (negative rises)"),
      spread: slider(8, 4, 30, 0.5, "Width of the dusty box that follows the camera, in meters"),
      height: slider(3, 1, 6, 0.1, "Height of the dust above the Floor, in meters"),
      darkVisibility: slider(
        0.3,
        0,
        1,
        0.01,
        "How visible the dust is away from every light: 0 shows it only near lights",
      ),
      lightResponse: slider(0.5, 0, 5, 0.01, "How much nearby lights brighten the specks"),
      lightLimit: slider(3, 0.5, 10, 0.1, "Brightest a speck can get from lights"),
      lightTint: slider(
        0.6,
        0,
        1,
        0.01,
        "0 keeps lit specks white, 1 gives them the light's color",
      ),
      nearFade: slider(
        0.4,
        0,
        2,
        0.01,
        "Specks closer than this to the camera fade out, in meters",
      ),
    },
    { collapsed: true },
  )

  useEffect(() => {
    dust.color.value.set(tuning.color)
    dust.amount.value = tuning.amount
    dust.size.value = tuning.size / MILLIMETERS_PER_METER
    dust.minPixels.value = tuning.minPixels
    dust.maxPixels.value = tuning.maxPixels
    dust.opacity.value = tuning.opacity
    dust.alphaVariation.value = tuning.alphaVariation
    dust.twinkle.value = tuning.twinkle
    dust.twinkleSpeed.value = tuning.twinkleSpeed
    dust.softness.value = tuning.softness
    dust.drift.value = tuning.drift
    dust.driftSpeed.value = tuning.driftSpeed
    dust.fall.value = tuning.fall
    dust.spread.value = tuning.spread
    dust.height.value = tuning.height
    dust.nearFade.value = tuning.nearFade
    dust.darkVisibility.value = tuning.darkVisibility
    dust.lightResponse.value = tuning.lightResponse
    dust.lightLimit.value = tuning.lightLimit
    dust.lightTint.value = tuning.lightTint
  }, [tuning])

  return tuning.enabled
}
