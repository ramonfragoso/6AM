import { useText } from "@/i18n/text"
import { creditSections } from "./credits"

export function CreditSections() {
  const { text } = useText()

  return creditSections(text.credits).map(({ heading, entries }) => (
    <section key={heading} className="flex max-w-3xl flex-col items-center gap-[2.8vh]">
      <h2 className="mb-[1vh] text-[2.4vh] tracking-[0.35em]">{text.credits.headings[heading]}</h2>
      {entries.map(({ work, by, license }) => (
        <div key={`${work} ${by}`} className="flex flex-col items-center gap-[0.5vh]">
          <p className="text-[3vh] leading-tight">{work}</p>
          <p className="text-[2.2vh]">
            {by}
            <span className="ms-[1.2vh] text-[1.6vh] tracking-[0.15em]">{license}</span>
          </p>
        </div>
      ))}
    </section>
  ))
}
