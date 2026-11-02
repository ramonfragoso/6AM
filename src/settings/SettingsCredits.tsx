import { CreditSections } from "@/dawn/CreditSections"
import { DEVELOPER_CREDIT, GAME_TITLE } from "@/dawn/credits"
import { useText } from "@/i18n/text"
import { MENU_ROW, MENU_SCROLL } from "./menuNavigation"
import { showSettingsPage } from "./settingsMenu"

const LINKEDIN_LABEL = "LinkedIn"

const LINKEDIN_LOGO =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"

export function SettingsCredits() {
  const { text } = useText()

  return (
    <div
      tabIndex={-1}
      {...{ [MENU_SCROLL]: "" }}
      className="relative h-full w-full overflow-y-auto overscroll-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex flex-col items-center gap-[12vh] px-6 py-[15vh] text-center">
        <div className="flex flex-col items-center gap-[6vh]">
          <p className="text-[18vmin] leading-none tracking-[0.06em]">{GAME_TITLE}</p>
          <div className="flex flex-col items-center gap-[1.5vh]">
            <p className="text-[2.4vh] tracking-[0.35em]">{text.credits.developer}</p>
            <a
              href={DEVELOPER_CREDIT.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-[1.5vh] rounded px-4 py-2 outline-none hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <span className="text-[4vh] leading-tight">{DEVELOPER_CREDIT.name}</span>
              <LinkedInIcon />
            </a>
          </div>
        </div>
        <CreditSections />
        <button
          type="button"
          {...{ [MENU_ROW]: "" }}
          onClick={() => showSettingsPage("main")}
          className="rounded border border-white/70 px-8 py-2 text-xl tracking-[0.3em] outline-none hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          {text.settings.back}
        </button>
      </div>
    </div>
  )
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={LINKEDIN_LABEL}
      className="size-[4vh] fill-current [filter:drop-shadow(0_0_6px_rgb(0_0_0/0.9))]"
    >
      <path d={LINKEDIN_LOGO} />
    </svg>
  )
}
