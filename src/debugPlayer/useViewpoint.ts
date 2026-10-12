import { useTuningControls } from "@/tuning/useTuningControls"

export const VIEWPOINTS = ["Player", "DebugPlayer"] as const

export type Viewpoint = (typeof VIEWPOINTS)[number]

const VIEWPOINT_SELECT = { value: VIEWPOINTS[0] as Viewpoint, options: VIEWPOINTS }

export function useViewpoint(): Viewpoint {
  const { viewpoint } = useTuningControls("Debug", { viewpoint: VIEWPOINT_SELECT })
  return isViewpoint(viewpoint) ? viewpoint : VIEWPOINTS[0]
}

function isViewpoint(value: unknown): value is Viewpoint {
  return VIEWPOINTS.includes(value as Viewpoint)
}
