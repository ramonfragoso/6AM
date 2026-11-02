import { CreditSections } from "@/dawn/CreditSections"
import { DEVELOPER_CREDIT, GAME_TITLE } from "@/dawn/credits"
import { MENU_ROW, MENU_SCROLL } from "./menuNavigation"
import { showSettingsPage } from "./settingsMenu"

const BACK_TEXT = "Back"

export function SettingsCredits() {
  return (
    <div
      tabIndex={-1}
      {...{ [MENU_SCROLL]: "" }}
      className="relative h-full w-full overflow-y-auto overscroll-contain outline-none"
    >
      <div className="flex flex-col items-center gap-[12vh] px-6 py-[15vh] text-center">
        <div className="flex flex-col items-center gap-[6vh]">
          <p className="text-[18vmin] leading-none tracking-[0.06em]">{GAME_TITLE}</p>
          <div className="flex flex-col items-center gap-[1.5vh]">
            <p className="text-[2.4vh] tracking-[0.35em]">{DEVELOPER_CREDIT.role}</p>
            <p className="text-[4vh] leading-tight">{DEVELOPER_CREDIT.name}</p>
          </div>
        </div>
        <CreditSections />
        <button
          type="button"
          {...{ [MENU_ROW]: "" }}
          onClick={() => showSettingsPage("main")}
          className="rounded border border-white/70 px-8 py-2 text-xl tracking-[0.3em] outline-none hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          {BACK_TEXT}
        </button>
      </div>
    </div>
  )
}
