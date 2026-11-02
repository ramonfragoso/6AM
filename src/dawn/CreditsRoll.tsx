import type { Ref } from "react"
import { BELOW_SCREEN } from "./credits"
import { CreditSections } from "./CreditSections"

type CreditsRollProps = { ref: Ref<HTMLDivElement> }

export function CreditsRoll({ ref }: CreditsRollProps) {
  return (
    <div
      ref={ref}
      className="absolute inset-x-0 top-0 flex flex-col will-change-transform items-center gap-[12vh] px-6 text-center text-black [text-shadow:var(--credits-roll-shadow)]"
      style={BELOW_SCREEN}
    >
      <CreditSections />
    </div>
  )
}
