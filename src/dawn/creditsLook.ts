export type CreditsLook = { background: string; glow: number; edge: number }

type GlowLayer = { spread: number; color: string; opacity: number }

export const creditsLook: CreditsLook = { background: "#ebe5d9", glow: 2.5, edge: 0.6 }

const WHITE = "255 255 255"

const WARM_WHITE = "255 250 236"

const EDGE_COLOR = "80 66 48"

const EDGE_SPREAD_VMIN = 0.15

const GLOW_LAYERS: GlowLayer[] = [
  { spread: 0.1, color: WHITE, opacity: 1 },
  { spread: 0.35, color: WHITE, opacity: 1 },
  { spread: 1, color: WARM_WHITE, opacity: 1 },
  { spread: 2, color: WARM_WHITE, opacity: 0.8 },
]

export function creditsTextShadow(look: CreditsLook) {
  const edge = `0 0 ${EDGE_SPREAD_VMIN}vmin rgb(${EDGE_COLOR} / ${look.edge})`
  return [...glowLayers(look), edge].join(", ")
}

export function rollTextShadow(look: CreditsLook) {
  return glowLayers(look).join(", ")
}

function glowLayers({ glow }: CreditsLook) {
  return GLOW_LAYERS.map(
    ({ spread, color, opacity }) => `0 0 ${glow * spread}vmin rgb(${color} / ${opacity})`,
  )
}
