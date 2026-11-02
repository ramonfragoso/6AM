import type { Ref } from "react"
import { SouthButtonIcon } from "@/input/SouthButtonIcon"

const PROMPT_TEXT = "PRESS"

const OPEN_KEY = "e"

type PromptProps = { ref: Ref<HTMLParagraphElement> }

export function Prompt({ ref }: PromptProps) {
  return (
    <p
      ref={ref}
      aria-live="polite"
      data-device="mouse"
      className="group pointer-events-none fixed top-[58%] left-1/2 z-40 flex -translate-x-1/2 items-center gap-[0.4em] text-2xl tracking-[0.2em] whitespace-nowrap text-white/80 opacity-0 [text-shadow:0_0_10px_rgb(0_0_0/0.9),0_0_2px_rgb(0_0_0)] select-none"
    >
      {PROMPT_TEXT}
      <span className="group-data-[device=mouse]:inline hidden">{OPEN_KEY}</span>
      <SouthButtonIcon />
    </p>
  )
}
