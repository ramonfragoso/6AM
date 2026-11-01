import { GAME_TITLE } from "@/dawn/credits"
import { useTitleScreen } from "./useTitleScreen"

const PLAY_TEXT = "Play"

const BUTTON_FADE_SECONDS = 1

export function TitleScreen() {
  const { stage, playable, play, settings } = useTitleScreen()
  const shown = stage === "shown"
  const leaving = stage === "opening" || stage === "playing"

  return (
    <div
      aria-hidden={!shown}
      className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-between py-[10vh] text-white"
    >
      <h1
        className="text-[22vmin] leading-none tracking-[0.06em] transition-opacity ease-in-out [text-shadow:0_0_3vmin_rgb(0_0_0/0.8),0_0_6vmin_rgb(255_255_255/0.25)]"
        style={{
          opacity: shown ? 1 : 0,
          transitionDuration: `${leaving ? settings.fadeOut : settings.titleFadeIn}s`,
        }}
      >
        {GAME_TITLE}
      </h1>
      <button
        type="button"
        disabled={!playable}
        onClick={play}
        className={`rounded border border-white/70 px-10 py-3 text-[3vh] tracking-[0.3em] transition-opacity ease-in-out hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white ${playable ? "pointer-events-auto" : ""}`}
        style={{
          opacity: playable ? 1 : 0,
          transitionDuration: `${leaving ? settings.fadeOut : BUTTON_FADE_SECONDS}s`,
        }}
      >
        {PLAY_TEXT}
      </button>
    </div>
  )
}
