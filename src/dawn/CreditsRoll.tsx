import type { Ref } from "react"
import { BELOW_SCREEN, CREDIT_SECTIONS } from "./credits"

type CreditsRollProps = { ref: Ref<HTMLDivElement> }

export function CreditsRoll({ ref }: CreditsRollProps) {
  return (
    <div
      ref={ref}
      className="absolute inset-x-0 top-0 flex flex-col will-change-transform items-center gap-[12vh] px-6 text-center text-black [text-shadow:var(--credits-roll-shadow)]"
      style={BELOW_SCREEN}
    >
      {CREDIT_SECTIONS.map(({ heading, entries }) => (
        <section key={heading} className="flex max-w-3xl flex-col items-center gap-[2.8vh]">
          <h2 className="mb-[1vh] text-[2.4vh] tracking-[0.35em]">{heading}</h2>
          {entries.map(({ work, by, license }) => (
            <div key={`${work} ${by}`} className="flex flex-col items-center gap-[0.5vh]">
              <p className="text-[3vh] leading-tight">{work}</p>
              <p className="text-[2.2vh]">
                {by}
                <span className="ml-[1.2vh] text-[1.6vh] tracking-[0.15em]">{license}</span>
              </p>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
