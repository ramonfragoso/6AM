import { useText } from "@/i18n/text"
import { BELOW_SCREEN, DEVELOPER_CREDIT, GAME_TITLE } from "./credits"
import { CreditsRoll } from "./CreditsRoll"
import { useDawnScreen } from "./useDawnScreen"

const INSTANT = "0s"

export function DawnScreen() {
  const { stage, parts, playAgain, fadeSeconds } = useDawnScreen()
  const covered = stage === "credits" || stage === "shown"
  const shown = stage === "shown"
  const { text, dir } = useText()

  return (
    <div
      ref={parts.screen}
      dir={dir}
      aria-hidden={stage === "hidden"}
      className="pointer-events-none fixed inset-0 z-[45] overflow-hidden text-white [text-shadow:var(--credits-shadow)]"
    >
      <div
        className="absolute inset-0 bg-[var(--credits-background)] transition-opacity"
        style={{
          opacity: covered ? 1 : 0,
          transitionDuration: covered ? INSTANT : `${fadeSeconds}s`,
        }}
      />
      <div
        ref={parts.white}
        className="absolute inset-0 bg-white opacity-0 will-change-[opacity]"
      />
      <p
        ref={parts.title}
        className="absolute inset-0 grid place-items-center text-[30vmin] leading-none tracking-[0.06em] opacity-0 will-change-[opacity]"
      >
        {GAME_TITLE}
      </p>
      <div
        ref={parts.byline}
        className="absolute inset-0 flex flex-col items-center justify-center gap-[3vmin] opacity-0 will-change-[opacity]"
      >
        <p className="text-[4.5vmin] tracking-[0.3em]">{text.credits.bylineLead}</p>
        <p className="text-[10vmin] leading-none tracking-[0.06em]">{DEVELOPER_CREDIT.name}</p>
      </div>
      <CreditsRoll ref={parts.roll} />
      <div
        ref={parts.closing}
        className="absolute inset-x-0 top-0 flex flex-col will-change-transform items-center gap-[5vh] px-6 text-center text-black [text-shadow:var(--credits-roll-shadow)]"
        style={BELOW_SCREEN}
      >
        <p className="text-[5vh] tracking-[0.2em]">{text.credits.closing}</p>
        <button
          type="button"
          disabled={!shown}
          onClick={playAgain}
          className={`rounded border border-black px-8 py-3 text-[3vh] tracking-[0.2em] shadow-[0_0_2vmin_rgb(255_255_255)] transition-opacity duration-700 focus-visible:outline-2 focus-visible:outline-black ${shown ? "pointer-events-auto" : ""}`}
          style={{ opacity: shown ? 1 : 0 }}
        >
          {text.credits.playAgain}
        </button>
      </div>
    </div>
  )
}
