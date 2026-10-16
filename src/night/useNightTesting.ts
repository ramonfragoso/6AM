import { button } from "leva"
import { useEffect } from "react"
import { HAUNTS } from "@/haunts/allHaunts"
import { useTuningControls } from "@/tuning/useTuningControls"
import { DRAW, setNextLoop, shiftHour, startNight } from "./night"

const NEXT_LOOP_OPTIONS: Record<string, string> = {
  Draw: DRAW,
  Clean: "clean",
  ...Object.fromEntries(HAUNTS.map((haunt) => [haunt.name, haunt.id])),
}

const ONE_HOUR = 1

export function useNightTesting() {
  const { nextLoop } = useTuningControls(
    "Haunts.Testing",
    {
      nextLoop: {
        value: DRAW,
        options: NEXT_LOOP_OPTIONS,
        hint: "Draw follows the odds and rules; anything else is chosen at every Wrap (and now, while you are in the Start Room)",
      },
      "Hour +1": button(() => shiftHour(ONE_HOUR)),
      "Hour −1": button(() => shiftHour(-ONE_HOUR)),
      "New Night": button(startNight),
    },
    { collapsed: true },
  )

  useEffect(() => setNextLoop(String(nextLoop)), [nextLoop])
}
