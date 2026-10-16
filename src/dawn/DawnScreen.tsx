import { useDawnScreen } from "./useDawnScreen"

const PLAY_AGAIN_TEXT = "Play again"

export function DawnScreen() {
  const { stage, playAgain, fadeSeconds } = useDawnScreen()
  const covered = stage === "fading" || stage === "shown"
  const shown = stage === "shown"

  return (
    <div
      aria-hidden={stage === "hidden"}
      className={`fixed inset-0 z-[45] grid place-items-center bg-black transition-opacity ${shown ? "" : "pointer-events-none"}`}
      style={{ opacity: covered ? 1 : 0, transitionDuration: `${fadeSeconds}s` }}
    >
      <button
        type="button"
        disabled={!shown}
        onClick={playAgain}
        className="rounded border border-white/30 px-8 py-3 text-2xl tracking-[0.2em] text-white/90 transition-opacity duration-700 hover:border-white/70 focus-visible:outline-2 focus-visible:outline-white"
        style={{ opacity: shown ? 1 : 0 }}
      >
        {PLAY_AGAIN_TEXT}
      </button>
    </div>
  )
}
