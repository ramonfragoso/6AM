import type { Ref } from "react"
import { FaceButtonIcon } from "@/input/FaceButtonIcon"

const PROMPT_TEXT = "PRESS"

const OPEN_KEY = "e"

const XBOX_A_GREEN = "#5dc21e"

const PLAYSTATION_CROSS_BLUE = "#7c9fe6"

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
      <OpenButtonIcon />
    </p>
  )
}

function OpenButtonIcon() {
  return (
    <span className="hidden size-8 place-items-center [filter:drop-shadow(0_0_6px_rgb(0_0_0/0.9))] group-data-[device=playstation]:grid group-data-[device=xbox]:grid">
      <FaceButtonIcon device="xbox">
        <text
          x="12"
          y="16.2"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="12"
          fontWeight="bold"
          letterSpacing="0"
          fill={XBOX_A_GREEN}
        >
          A
        </text>
      </FaceButtonIcon>
      <FaceButtonIcon device="playstation">
        <path
          d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5"
          stroke={PLAYSTATION_CROSS_BLUE}
          strokeWidth="1.8"
        />
      </FaceButtonIcon>
    </span>
  )
}
