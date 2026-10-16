import type { Ref } from "react"

const PROMPT_TEXT = "Press E"

type PromptProps = { ref: Ref<HTMLParagraphElement> }

export function Prompt({ ref }: PromptProps) {
  return (
    <p
      ref={ref}
      aria-live="polite"
      className="pointer-events-none fixed top-[58%] left-1/2 z-40 -translate-x-1/2 text-2xl tracking-[0.2em] whitespace-nowrap text-white/80 opacity-0 [text-shadow:0_0_10px_rgb(0_0_0/0.9),0_0_2px_rgb(0_0_0)] select-none"
    >
      {PROMPT_TEXT}
    </p>
  )
}
