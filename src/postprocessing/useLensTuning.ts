import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { PROJECTIONS, type LensSettings, type Projection } from "./lens"

const PROJECTION_SELECT = {
  value: PROJECTIONS[0] as Projection,
  options: PROJECTIONS,
  hint: "Rectilinear is a normal lens. Equidistant is the classic fisheye, Equisolid and Orthographic squeeze the edges harder, Stereographic keeps shapes and fits wide fovs gently, Panini keeps vertical lines straight",
}

export function useLensTuning(): LensSettings {
  const tuning = useTuningControls(
    "Lens",
    {
      projection: PROJECTION_SELECT,
      strength: slider(1, 0, 1, 0.01, "0 is the normal lens, 1 the full projection"),
      zoom: slider(1, 1, 3, 0.01, "Crops toward the center; 1 shows everything the camera sees"),
      paniniDistance: {
        ...slider(
          1,
          0,
          1,
          0.01,
          "0 is the normal lens, 1 the strongest Panini compression of the edges",
        ),
        render: (get: (path: string) => unknown) => get("Lens.projection") === "Panini",
      },
    },
    { collapsed: true },
  )
  return { ...tuning, projection: tuning.projection as Projection }
}
