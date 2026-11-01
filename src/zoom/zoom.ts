import { MathUtils } from "three"

export type ZoomDirection = "in" | "out"

export type Zoom = { progress: number; direction: ZoomDirection }

export type ZoomTurn = { direction: ZoomDirection; seconds: number }

export type FarFocus = { share: number; maxFocus: number }

export type FocusLimits = { maxFocus: number }

const NO_MAGNIFICATION = 1

const FULL = 1

export const cameraZoom = {
  magnification: NO_MAGNIFICATION,
  progress: 0,
  farFocus: { share: 0, maxFocus: 0 } as FarFocus,
}

export function createZoom(): Zoom {
  return { progress: 0, direction: "out" }
}

export function advanceZoom(
  zoom: Zoom,
  held: boolean,
  delta: number,
  duration: number,
): ZoomTurn | null {
  const direction: ZoomDirection = held ? "in" : "out"
  const turned = direction !== zoom.direction
  zoom.direction = direction
  const seconds = secondsLeft(zoom, duration)
  const step = delta / duration
  zoom.progress = MathUtils.clamp(zoom.progress + (held ? step : -step), 0, 1)
  return turned && seconds > 0 ? { direction, seconds } : null
}

export function isFull(zoom: Zoom) {
  return zoom.progress >= FULL
}

export function advanceFarFocus(share: number, full: boolean, delta: number, seconds: number) {
  const step = delta / seconds
  return MathUtils.clamp(share + (full ? step : -step), 0, 1)
}

export function withFarFocus<S extends FocusLimits>(settings: S, { share, maxFocus }: FarFocus): S {
  const eased = MathUtils.smoothstep(share, 0, 1)
  return { ...settings, maxFocus: MathUtils.lerp(settings.maxFocus, maxFocus, eased) }
}

export function magnificationOf(zoom: Zoom, maxZoom: number) {
  return maxZoom ** MathUtils.smoothstep(zoom.progress, 0, 1)
}

export function zoomedFov(fov: number, magnification: number) {
  const halfAngle = MathUtils.degToRad(fov) / 2
  return MathUtils.radToDeg(2 * Math.atan(Math.tan(halfAngle) / magnification))
}

function secondsLeft({ progress, direction }: Zoom, duration: number) {
  return (direction === "in" ? 1 - progress : progress) * duration
}
