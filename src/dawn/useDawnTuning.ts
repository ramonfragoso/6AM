import { button } from "leva"
import { useEffect, useRef } from "react"
import { slider } from "@/debug/slider"
import { useTuningControls } from "@/tuning/useTuningControls"
import { ENDING_MUSIC_CUES } from "./credits"
import { creditsLook } from "./creditsLook"
import { dawnEvents } from "./dawnEvents"
import { dawnTiming } from "./dawnTiming"

const STEP = 0.1

const FINE_STEP = 0.01

export function useDawnTuning() {
  const { fadeOut, fadeIn } = useTuningControls(
    "Dawn",
    {
      fadeOut: slider(
        dawnTiming.fadeOut,
        0.1,
        10,
        STEP,
        "Seconds every Sound but the music takes to fade out once the Player is in the Dawn Light",
      ),
      fadeIn: slider(
        dawnTiming.fadeIn,
        0.1,
        10,
        STEP,
        "Seconds the new Night takes to fade in after Play again",
      ),
    },
    { collapsed: true },
  )

  const credits = useTuningControls(
    "Dawn.Credits",
    {
      musicDelay: slider(
        dawnTiming.musicDelay,
        0,
        10,
        STEP,
        "Seconds of white after the Player walks into the Dawn Light before the ending music starts",
      ),
      musicFadeIn: slider(
        dawnTiming.musicFadeIn,
        0,
        ENDING_MUSIC_CUES.firstHeavy,
        STEP,
        "Seconds the ending music takes to fade in from silence; 0 starts it at full volume. The Credits stay timed to the music, so the cards still land on the distortion",
      ),
      settle: slider(
        dawnTiming.settle,
        0.1,
        ENDING_MUSIC_CUES.firstHeavy,
        STEP,
        "Seconds from the start of the music for the full white to settle into the Credits background",
      ),
      rollStart: slider(
        dawnTiming.rollStart,
        ENDING_MUSIC_CUES.drums,
        ENDING_MUSIC_CUES.end,
        STEP,
        "Second of the music when the Credits Roll starts rising from the bottom (38.04 s: the second distortion)",
      ),
      rollCentered: slider(
        dawnTiming.rollCentered,
        ENDING_MUSIC_CUES.secondHeavy,
        ENDING_MUSIC_CUES.end,
        STEP,
        "Second of the music when the closing line reaches the middle of the screen and stops there (106.6 s: the guitar turns clean for the last time); sets the roll's speed",
      ),
      buttonDelay: slider(
        dawnTiming.buttonDelay,
        0,
        10,
        STEP,
        "Seconds after the closing line stops before Play again shows under it",
      ),
    },
    { collapsed: true },
  )

  const look = useTuningControls(
    "Dawn.Credits.Look",
    {
      background: {
        value: creditsLook.background,
        hint: "Color the white settles into behind the Credits; pure white hides the white letters",
      },
      glow: slider(
        creditsLook.glow,
        0,
        10,
        STEP,
        "How far the light glows around the letters (the white title and byline, the black roll), in hundredths of the screen's short side",
      ),
      edge: slider(
        creditsLook.edge,
        0,
        1,
        FINE_STEP,
        "Strength of the faint warm shadow at the edges of the white title and byline that keeps them readable on a light background (the roll is black)",
      ),
    },
    { collapsed: true },
  )

  const testFrom = useRef(0)
  const { from } = useTuningControls(
    "Dawn.Testing",
    {
      from: slider(
        0,
        0,
        ENDING_MUSIC_CUES.end,
        STEP,
        "Second of the music Play credits starts from",
      ),
      "Play credits": button(() =>
        dawnEvents.emit({ kind: "playCredits", from: testFrom.current }),
      ),
    },
    { collapsed: true },
  )

  useEffect(() => {
    testFrom.current = from
  }, [from])

  useEffect(() => {
    Object.assign(dawnTiming, { fadeOut, fadeIn }, credits)
  }, [fadeOut, fadeIn, credits])

  useEffect(() => {
    Object.assign(creditsLook, look)
  }, [look])
}
