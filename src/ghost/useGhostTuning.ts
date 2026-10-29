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
        "Meters from the Player at which the Ghost vanishes",
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
      fadeSeconds: slider(
        0.5,
        0.05,
        3,
        STEP,
        "Seconds the Ghost takes to fade out once it reaches the Player",
      ),
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
        "Scream looping from the Ghost while it walks, until it has faded out",
      ),
      loopFadeIn: slider(0.3, 0, 3, STEP, "Seconds the loop takes to fade in"),
      vanish: volumeSlider(1, "Second violin stinger when the Ghost vanishes"),
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
  const soundSettings = useMemo(
    () => ({
      sighting: sound.sighting,
      wake: sound.wake,
      loop: sound.loop,
      loopFadeIn: sound.loopFadeIn,
      vanish: sound.vanish,
      tone: toneOf(sound.muffle),
      shape: emitterShapeOf(sound),
    }),
    [sound],
  )
  return { settings, sound: soundSettings }
}
