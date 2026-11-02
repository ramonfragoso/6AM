import { LANGUAGE_NAMES, LANGUAGES } from "./languages"
import { LANGUAGE_OPTION, LANGUAGE_PICKER } from "./languageList"
import { useLanguagePicker } from "./useLanguagePicker"

type LanguagePickerProps = {
  opens: "above" | "below"
  label: string
  controlAttributes?: Record<string, string>
}

const PLACEMENT = { above: "bottom-full mb-2", below: "top-full mt-2" }

const FOCUS_RING =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"

export function LanguagePicker({ opens, label, controlAttributes }: LanguagePickerProps) {
  const { picker, root, trigger, language, open, toggle, choose, handleListKey } =
    useLanguagePicker()

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        {...{ [LANGUAGE_PICKER]: "" }}
        {...controlAttributes}
        onClick={toggle}
        className={`flex items-center gap-3 rounded border border-white/40 px-4 py-1 text-base tracking-[0.15em] hover:bg-white/10 ${FOCUS_RING}`}
      >
        <span lang={language}>{LANGUAGE_NAMES[language]}</span>
        <Chevron flipped={open === (opens === "below")} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          onKeyDown={handleListKey}
          className={`absolute left-1/2 z-10 flex -translate-x-1/2 flex-col gap-1 rounded border border-white/30 bg-black p-2 ${PLACEMENT[opens]}`}
        >
          {LANGUAGES.map((option) => (
            <li key={option} className="flex">
              <button
                type="button"
                role="option"
                lang={option}
                aria-selected={option === language}
                {...{ [LANGUAGE_OPTION]: picker }}
                onClick={() => choose(option)}
                className={`w-full rounded px-5 py-1.5 text-base tracking-[0.15em] whitespace-nowrap ${FOCUS_RING} ${option === language ? "bg-white/15" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {LANGUAGE_NAMES[option]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Chevron({ flipped }: { flipped: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`size-4 fill-none stroke-current stroke-2 ${flipped ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
