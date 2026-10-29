import { slider } from "@/debug/slider"
import { muffleSlider, volumeSlider } from "@/sound/soundSliders"
import { useTuningControls } from "@/tuning/useTuningControls"

const SHARE_STEP = 0.01

export function useDoorSoundTuning() {
  return useTuningControls(
    "Sound.Door",
    {
      volume: volumeSlider(1, "Loudness of the door during a Passage"),
      keepPitch: {
        value: true,
        hint: "On: the door sounds as recorded however fast the Passage is (time-stretched). Off: a faster Passage plays it higher, a slower one deeper",
      },
      muffle: muffleSlider(0, "Muffles the door"),
      end: slider(
        1,
        0,
        1,
        SHARE_STEP,
        "When the door sound ends, as a share of the Passage duration. It starts once the camera has lined up and the door starts to open (the later of Passage › Timing lineUpEnd and openStart), and is sped up or slowed down to fit",
      ),
    },
    { collapsed: true },
  )
}
