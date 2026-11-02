import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import { gameSettings, QUALITY_PIXEL_RATIO, useGameSettings } from "./gameSettings"

export function initialPixelRatio() {
  return QUALITY_PIXEL_RATIO[gameSettings.quality]
}

export function QualityPixelRatio() {
  const setDpr = useThree((state) => state.setDpr)
  const { quality } = useGameSettings()

  useEffect(() => setDpr(QUALITY_PIXEL_RATIO[quality]), [setDpr, quality])

  return null
}
