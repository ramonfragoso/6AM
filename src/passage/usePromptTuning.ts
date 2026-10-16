import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"

export function usePromptTuning() {
  return useTuningControls(
    "Prompt",
    {
      reach: slider(1.5, 0.5, 3, 0.05, "Meters from the middle of a door where Press E appears"),
      facing: slider(
        50,
        10,
        90,
        1,
        "Degrees the view may point away from the door and still show Press E",
      ),
      fade: slider(0.25, 0.05, 1, 0.01, "Seconds Press E takes to fade in or out"),
    },
    { collapsed: true },
  )
}
