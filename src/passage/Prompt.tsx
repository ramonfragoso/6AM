import type { Ref } from "react"
import { useText } from "@/i18n/text"
import { SouthButtonIcon } from "@/input/SouthButtonIcon"

const OPEN_KEY = "e"

type PromptProps = { ref: Ref<HTMLParagraphElement> }

export function Prompt({ ref }: PromptProps) {
  const { text, dir } = useText()

  return (
    <p
      ref={ref}
      dir={dir}
      aria-live="polite"
      data-device="mouse"
      className="group pointer-events-none fixed top-[58%] left-1/2 z-40 flex -translate-x-1/2 items-center gap-[0.4em] text-2xl tracking-[0.2em] whitespace-nowrap text-white/80 opacity-0 [text-shadow:0_0_10px_rgb(0_0_0/0.9),0_0_2px_rgb(0_0_0)] select-none"
    >
      {text.prompt.lead}
      <span className="group-data-[device=mouse]:inline hidden">{OPEN_KEY}</span>
      <SouthButtonIcon />
      {text.prompt.trail}
    </p>
  )
}
