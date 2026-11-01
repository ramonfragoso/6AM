import { button } from "leva"
import { useEffect, useMemo } from "react"
import { slider } from "@/debug/slider"
import { hauntState } from "@/haunts/hauntState"
import { nightClock } from "@/night/nightClock"
import {
  emitterShapeOf,
  emitterSliders,
  muffleSlider,
  toneOf,
  volumeSlider,
} from "@/sound/soundSliders"
import { useTuningControls } from "@/tuning/useTuningControls"
import { newGhostAttack, WALK_CLIP_SPEED } from "./ghost"
import { ghostLook } from "./ghostLook"

const LOOP_EMITTER = { refDistance: 3, rolloff: 1, maxDistance: 20 }

const STEP = 0.01

const COLLAPSED = { collapsed: true }

export type GhostSettings = ReturnType<typeof useGhostTuning>["settings"]

export type GhostSound = ReturnType<typeof useGhostTuning>["sound"]

export function useGhostTuning() {
  const attack = useTuningControls(
    "Haunts.Ghost Attack",
    {
      "Appear now": button(() => {
        hauntState.ghostAttack = newGhostAttack(nightClock())
      }),
      "Send away": button(() => {
        hauntState.ghostAttack = null
      }),
      size: slider(
        1,
        0.5,
        2,
        STEP,
        "How big the Ghost is (1 is as modeled, about 1.8 m tall). It grows from its feet, and its walk slows with its stride, so the feet do not slide",
      ),
      along: slider(
        -0.8,
        -4,
        4,
        STEP,
        "Meters along the second Corridor from the Coat Rack where the Ghost waits: negative toward the Corner",
      ),
      fromWall: slider(
        0.35,
        0.1,
        1,
        STEP,
        "Meters between the Coat Rack's wall and the Ghost, who stands facing the opposite wall",
      ),
      sightFacing: slider(
        20,
        1,
        60,
        0.5,
        "Degrees off the Player's view within which the Ghost counts as seen (from the second Corridor), playing the piano sting once",
      ),
      wakeDistance: slider(
        2,
        0.5,
        6,
        STEP,
        "Meters from the Player at which the Ghost wakes: the walk fades in, the violin plays and the loop starts",
      ),
      catchDistance: slider(
        0.6,
        0.1,
        2,
        STEP,
        "Meters from the Player at which the Ghost Strangles them",
      ),
      speed: slider(0.9, 0, 4, STEP, "Meters per second the Ghost walks toward the Player"),
      walkClipSpeed: slider(
        WALK_CLIP_SPEED,
        0.2,
        3,
        STEP,
        "Meters per second at which the walk plays at its own pace; the walk plays at speed / this, so its feet do not slide. Lower it if they slide forward",
      ),
      turnRate: slider(
        4,
        0.5,
        20,
        0.1,
        "How fast the Ghost turns toward the Player (per second); it only walks forward, slower the further it must turn",
      ),
      blendSeconds: slider(0.8, 0, 3, STEP, "Seconds the sad idle takes to blend into the walk"),
    },
    COLLAPSED,
  )
  const strangle = useTuningControls(
    "Haunts.Ghost Attack.Strangle",
    {
      grabBlend: slider(0.2, 0, 1, STEP, "Seconds the walk takes to blend into the strangle"),
      grabSeconds: slider(
        0.25,
        0,
        2,
        STEP,
        "Seconds the camera takes to move from the Player's eye into the Ghost's hands",
      ),
      up: slider(
        0.2,
        -0.3,
        0.6,
        0.005,
        "Meters the camera sits above the middle of the Ghost's hands, as a head above the neck they hold",
      ),
      back: slider(
        0.05,
        -0.3,
        0.5,
        0.005,
        "Meters the camera sits back from the Ghost's hands, away from it, so its forearms show at the bottom",
      ),
      lookAt: slider(
        0.45,
        0,
        1,
        STEP,
        "Where the camera looks on the Ghost's head: 0 the base of the skull, 1 its crown (about 0.45 is the eyes)",
      ),
      lookSmoothing: slider(
        0.05,
        0,
        0.5,
        0.005,
        "Seconds the view lags behind the Ghost's face; 0 follows every shake exactly",
      ),
      holdSeconds: slider(
        3,
        0.5,
        12,
        STEP,
        "Seconds the Ghost Strangles the Player before everything goes black (the 4 s clip loops)",
      ),
      fadeOut: slider(
        0.1,
        0,
        2,
        STEP,
        "Seconds the picture takes to go black; every Sound cuts out at once",
      ),
      blackSeconds: slider(0.5, 0, 5, STEP, "Seconds of black before the Player wakes"),
      fadeIn: slider(
        1.5,
        0.1,
        5,
        STEP,
        "Seconds the Start Room and every Sound take to fade back in",
      ),
    },
    COLLAPSED,
  )
  const shake = useTuningControls(
    "Haunts.Ghost Attack.Shake",
    {
      shakeRate: slider(
        20,
        1,
        60,
        0.5,
        "New random shake offsets per second for the torso, neck and head, eased between",
      ),
      headAngle: slider(
        3,
        0,
        20,
        0.1,
        "Degrees each of the neck and head shakes at most (on top of every animation)",
      ),
      torsoShare: slider(
        0.3,
        0,
        1,
        STEP,
        "Share of headAngle each of the three spine bones shakes; they add up toward the head",
      ),
      jerkEvery: slider(3, 0.5, 20, 0.1, "Average seconds between sudden head jerks (at random)"),
      jerkAngle: slider(12, 0, 45, 0.5, "Degrees of a sudden head jerk; 0 turns them off"),
      jerkSeconds: slider(0.3, 0.05, 2, STEP, "Seconds a head jerk takes to settle back"),
    },
    COLLAPSED,
  )
  const look = useTuningControls(
    "Haunts.Ghost Attack.Look",
    {
      opacity: slider(
        ghostLook.opacity.value,
        0,
        1,
        STEP,
        "How solid the Ghost is: 1 hides what is behind it, lower lets it show through",
      ),
      color: { value: "#a9d6d3", hint: "The Ghost's skin" },
      glow: slider(
        ghostLook.glow.value,
        0,
        2,
        STEP,
        "How much the skin shines by itself, so it shows in the dark (it lights nothing else)",
      ),
      roughness: slider(ghostLook.roughness.value, 0, 1, STEP, "0 is glossy, 1 matte"),
      eyeColor: { value: "#ffffff", hint: "Color the eyes glow" },
      eyeGlow: slider(
        ghostLook.eyeGlow.value,
        0,
        20,
        STEP,
        "How brightly the eyes glow (they light nothing else)",
      ),
      decalGlow: slider(
        ghostLook.decalGlow.value,
        0,
        3,
        STEP,
        "How much the blood crosses on the forehead and chest shine by themselves, so they stay red in the dark",
      ),
    },
    COLLAPSED,
  )
  const sound = useTuningControls(
    "Sound.Ghost Attack",
    {
      sighting: volumeSlider(1, "Piano sting when the Player first looks at the Ghost"),
      wake: volumeSlider(1, "Violin stinger when the Ghost starts walking"),
      loop: volumeSlider(
        0.4,
        "Scream looping from the Ghost while it walks and Strangles, until the picture goes black",
      ),
      loopFadeIn: slider(0.3, 0, 3, STEP, "Seconds the loop takes to fade in"),
      strangle: volumeSlider(1, "Second violin stinger when the Ghost Strangles the Player"),
      muffle: muffleSlider(0, "Muffles every Ghost Attack sound"),
      ...emitterSliders(LOOP_EMITTER),
    },
    COLLAPSED,
  )

  useEffect(() => {
    ghostLook.opacity.value = look.opacity
    ghostLook.color.value.set(look.color)
    ghostLook.glow.value = look.glow
    ghostLook.roughness.value = look.roughness
    ghostLook.eyeColor.value.set(look.eyeColor)
    ghostLook.eyeGlow.value = look.eyeGlow
    ghostLook.decalGlow.value = look.decalGlow
  }, [look])

  const settings = useMemo(() => ({ ...attack }), [attack])
  const strangleSettings = useMemo(() => ({ ...strangle }), [strangle])
  const shakeSettings = useMemo(() => ({ ...shake }), [shake])
  const soundSettings = useMemo(
    () => ({
      sighting: sound.sighting,
      wake: sound.wake,
      loop: sound.loop,
      loopFadeIn: sound.loopFadeIn,
      strangle: sound.strangle,
      tone: toneOf(sound.muffle),
      shape: emitterShapeOf(sound),
    }),
    [sound],
  )
  return {
    settings,
    strangle: strangleSettings,
    shake: shakeSettings,
    sound: soundSettings,
  }
}
