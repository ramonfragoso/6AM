import type { Ref } from "react"
import { useText } from "@/i18n/text"
import { SouthButtonIcon } from "@/input/SouthButtonIcon"
import {
  HAUNT_COUNT_TEXT_ATTRIBUTE,
  READING_DARK_PROPERTY,
  READING_TEXT_PROPERTY,
} from "./useNoteReading"

const CLOSE_KEY = "esc"

const SHADOWED_TEXT = "[text-shadow:0_0_14px_rgb(0_0_0/0.95),0_0_3px_rgb(0_0_0)]"

type NoteReadingProps = { ref: Ref<HTMLDivElement> }

export function NoteReading({ ref }: NoteReadingProps) {
  const { text, dir } = useText()
  const { guideTitle, guideLines, close } = text.reading

  return (
    <div
      ref={ref}
      dir={dir}
      data-device="mouse"
      data-note="guide"
      aria-live="polite"
      className="group pointer-events-none fixed inset-0 z-40 grid place-items-center select-none"
    >
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: `var(${READING_DARK_PROPERTY}, 0)` }}
      />
      <div
        className={`relative flex max-w-3xl flex-col items-center gap-12 px-6 text-center text-white/90 ${SHADOWED_TEXT}`}
        style={{ opacity: `var(${READING_TEXT_PROPERTY}, 0)` }}
      >
        <div className="hidden flex-col items-center gap-6 group-data-[note=guide]:flex">
          <p className="text-3xl tracking-[0.15em]">{guideTitle}</p>
          {guideLines.map((line) => (
            <p key={line} className="text-xl leading-relaxed tracking-[0.08em]">
              {line}
            </p>
          ))}
        </div>
        <p
          {...{ [HAUNT_COUNT_TEXT_ATTRIBUTE]: "" }}
          className="hidden text-2xl leading-relaxed tracking-[0.1em] group-data-[note=hauntCount]:block"
        />
        <p className="flex items-center gap-[0.4em] text-lg tracking-[0.2em] text-white/70">
          {close}
          <span className="hidden group-data-[device=mouse]:inline">{CLOSE_KEY}</span>
          <SouthButtonIcon />
        </p>
      </div>
    </div>
  )
}
