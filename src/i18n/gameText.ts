export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

export type CreditHeading =
  "music" | "models" | "materials" | "paintings" | "animationAndSound" | "typeAndCode"

export type GameText = {
  play: string
  language: string
  loading: string
  gameView: string
  noGraphics: string
  prompt: { lead: string; trail: string }
  zoom: string
  reading: {
    closeWithKey: string
    closeWithButton: string
    guideTitle: string
    guideLines: string[]
    hauntCount: PluralForms
  }
  settings: {
    title: string
    quality: string
    qualities: { low: string; medium: string; max: string }
    bloom: string
    depthOfField: string
    sensitivity: string
    invertX: string
    invertY: string
    volume: string
    credits: string
    close: string
    back: string
  }
  credits: {
    bylineLead: string
    developer: string
    closing: string
    playAgain: string
    skip: string
    headings: Record<CreditHeading, string>
    ghostAnimations: string
    soundEffects: string
    freesoundContributors: string
    publicDomain: string
    freesoundLicenses: string
  }
}
