import { GAME_TITLE } from "@/dawn/credits"
import { LanguagePicker } from "@/i18n/LanguagePicker"
import { useText } from "@/i18n/text"
import { MENU_CONTROL, MENU_ROW } from "@/settings/menuNavigation"
import { useTitleScreen } from "./useTitleScreen"

const BUTTON_FADE_SECONDS = 1

export function TitleScreen() {
  const { menu, stage, playable, play, settings } = useTitleScreen()
  const { text, dir } = useText()
  const shown = stage === "shown"
  const leaving = stage === "opening" || stage === "playing"
  const buttonFade = {
    opacity: playable ? 1 : 0,
    transitionDuration: `${leaving ? settings.fadeOut : BUTTON_FADE_SECONDS}s`,
  }

  return (
    <div
      ref={menu}
      dir={dir}
      aria-hidden={!shown}
      inert={!playable}
      className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-between pt-[10vh] pb-[4vh] text-white"
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
      <div className="flex flex-col items-center gap-[3vh]">
        <button
          type="button"
          disabled={!playable}
          onClick={play}
          {...{ [MENU_ROW]: "", [MENU_CONTROL]: "" }}
          className={`rounded border border-white/70 px-10 py-3 text-[3vh] tracking-[0.3em] transition-opacity ease-in-out hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white ${playable ? "pointer-events-auto" : ""}`}
          style={buttonFade}
        >
          {text.play}
        </button>
        <div
          {...{ [MENU_ROW]: "" }}
          className={`transition-opacity ease-in-out [text-shadow:0_0_10px_rgb(0_0_0/0.9)] ${playable ? "pointer-events-auto" : ""}`}
          style={buttonFade}
        >
          <LanguagePicker
            opens="above"
            label={text.language}
            controlAttributes={{ [MENU_CONTROL]: "" }}
          />
        </div>
      </div>
    </div>
  )
}
