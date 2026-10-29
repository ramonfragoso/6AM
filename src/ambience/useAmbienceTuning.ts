import { useMemo } from "react"
import type { LoopSettings } from "@/sound/soundLoop"
import { muffleSlider, pitchSlider, toneOf, volumeSlider } from "@/sound/soundSliders"
import { useTuningControls } from "@/tuning/useTuningControls"

export function useAmbienceTuning() {
  const first = useTrackControls("Sound.Ambience.First", "ambient_loop, the long one")
  const second = useTrackControls("Sound.Ambience.Second", "ambient_loop2, the short one")
  return { first, second }
}

function useTrackControls(folder: string, track: string) {
  const { volume, pitch, muffle } = useTuningControls(
    folder,
    {
      volume: volumeSlider(1, `Loudness of ${track}, which plays all the time`),
      pitch: pitchSlider(0, "Pitch of the track"),
      muffle: muffleSlider(0, "Muffles the track"),
    },
    { collapsed: true },
  )
  return useMemo<LoopSettings>(
    () => ({ volume, pitch, tone: toneOf(muffle) }),
    [volume, pitch, muffle],
  )
}
