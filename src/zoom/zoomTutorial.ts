import { MathUtils } from "three"

export type ZoomTutorial = { opacity: number; fill: number; learnedAt: number | null }

export type ZoomTutorialMoment = {
  teaching: boolean
  progress: number
  time: number
  delta: number
}

export type ZoomTutorialSettings = { fade: number; linger: number }

const FULL = 1

export function createZoomTutorial(): ZoomTutorial {
  return { opacity: 0, fill: 0, learnedAt: null }
}

export function advanceZoomTutorial(
  tutorial: ZoomTutorial,
  { teaching, progress, time, delta }: ZoomTutorialMoment,
  { fade, linger }: ZoomTutorialSettings,
) {
  if (tutorial.learnedAt === null && teaching && progress >= FULL) tutorial.learnedAt = time
  const { learnedAt } = tutorial
  tutorial.fill = learnedAt === null ? progress : FULL
  const shown = learnedAt === null ? teaching : time - learnedAt < linger
  const step = delta / fade
  tutorial.opacity = MathUtils.clamp(tutorial.opacity + (shown ? step : -step), 0, 1)
}
