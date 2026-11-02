import { type ChangeEvent, type ReactNode, useRef } from "react"
import {
  type GameSettings,
  QUALITIES,
  type Quality,
  updateSettings,
  useGameSettings,
} from "./gameSettings"
import { MENU_CONTROL, MENU_ROW, SETTING_KEY } from "./menuNavigation"
import { SettingsCredits } from "./SettingsCredits"
import { closeSettings, showSettingsPage } from "./settingsMenu"
import { useSettingsMenu } from "./useSettingsMenu"

type ToggleSetting = "bloom" | "depthOfField" | "invertX" | "invertY"

type SliderSetting = "sensitivity" | "volume"

const TITLE = "Settings"

const QUALITY_LABEL = "Quality"

const QUALITY_NAMES: Record<Quality, string> = { low: "Low", medium: "Medium", max: "Max" }

const SENSITIVITY_LABEL = "Mouse sensitivity"

const VOLUME_LABEL = "Volume"

const CREDITS_TEXT = "Credits"

const CLOSE_TEXT = "Close"

const TOGGLES: { setting: ToggleSetting; label: string }[] = [
  { setting: "bloom", label: "Bloom" },
  { setting: "depthOfField", label: "Depth of Field" },
]

const INVERSIONS: { setting: ToggleSetting; label: string }[] = [
  { setting: "invertX", label: "Invert X axis" },
  { setting: "invertY", label: "Invert Y axis" },
]

const SLIDER_STEP = 0.01

const DARKNESS = { main: 0.8, credits: 0.92 }

const SHADOWED_TEXT = "[text-shadow:0_0_14px_rgb(0_0_0/0.95),0_0_3px_rgb(0_0_0)]"

const FOCUS_RING =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"

const BUTTON = `rounded border border-white/70 px-8 py-2 text-xl tracking-[0.3em] hover:bg-white/10 ${FOCUS_RING}`

export function SettingsMenu() {
  const menu = useRef<HTMLDivElement>(null)
  const { open, page } = useSettingsMenu(menu)

  return (
    <div
      ref={menu}
      inert={!open}
      aria-hidden={!open}
      className={`fixed inset-0 z-[46] grid place-items-center text-white transition-opacity duration-200 ease-out select-none ${SHADOWED_TEXT}`}
      style={{ opacity: open ? 1 : 0 }}
    >
      <div
        className="absolute inset-0 bg-black transition-opacity duration-200"
        style={{ opacity: DARKNESS[page] }}
      />
      {page === "main" ? <MainPage /> : <SettingsCredits />}
    </div>
  )
}

function MainPage() {
  const settings = useGameSettings()

  return (
    <div className="relative flex max-h-full flex-col items-center gap-6 overflow-y-auto px-4 py-8 text-center">
      <h2 className="mb-2 text-4xl tracking-[0.15em]">{TITLE}</h2>
      <QualityChoice quality={settings.quality} />
      {TOGGLES.map(({ setting, label }) => (
        <Toggle key={setting} setting={setting} label={label} settings={settings} />
      ))}
      <Slider setting="sensitivity" label={SENSITIVITY_LABEL} settings={settings} />
      {INVERSIONS.map(({ setting, label }) => (
        <Toggle key={setting} setting={setting} label={label} settings={settings} />
      ))}
      <Slider setting="volume" label={VOLUME_LABEL} settings={settings} />
      <div className="mt-2 flex flex-col items-center gap-4">
        <MenuButton onClick={() => showSettingsPage("credits")}>{CREDITS_TEXT}</MenuButton>
        <MenuButton onClick={closeSettings}>{CLOSE_TEXT}</MenuButton>
      </div>
    </div>
  )
}

function QualityChoice({ quality }: { quality: Quality }) {
  return (
    <div {...{ [MENU_ROW]: "" }} className="flex flex-col items-center gap-2">
      <p className="text-lg tracking-[0.15em]">{QUALITY_LABEL}</p>
      <div role="radiogroup" aria-label={QUALITY_LABEL} className="flex gap-2">
        {QUALITIES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === quality}
            {...{ [MENU_CONTROL]: "" }}
            onClick={() => updateSettings({ quality: option })}
            className={`rounded border px-4 py-1 text-base tracking-[0.15em] ${FOCUS_RING} ${option === quality ? "border-white bg-white/15" : "border-white/30 text-white/60 hover:text-white"}`}
          >
            {QUALITY_NAMES[option]}
          </button>
        ))}
      </div>
    </div>
  )
}

type SettingProps<Setting> = { setting: Setting; label: string; settings: GameSettings }

function Toggle({ setting, label, settings }: SettingProps<ToggleSetting>) {
  return (
    <label
      {...{ [MENU_ROW]: "" }}
      className="flex cursor-pointer items-center gap-3 text-lg tracking-[0.15em]"
    >
      <input
        type="checkbox"
        {...{ [MENU_CONTROL]: "" }}
        checked={settings[setting]}
        onChange={(event) => updateSettings({ [setting]: event.target.checked })}
        className={`size-5 cursor-pointer accent-white ${FOCUS_RING}`}
      />
      {label}
    </label>
  )
}

function Slider({ setting, label, settings }: SettingProps<SliderSetting>) {
  const change = (event: ChangeEvent<HTMLInputElement>) =>
    updateSettings({ [setting]: Number(event.target.value) })

  return (
    <label {...{ [MENU_ROW]: "" }} className="flex flex-col items-center gap-2">
      <span className="text-lg tracking-[0.15em]">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={SLIDER_STEP}
        {...{ [MENU_CONTROL]: "", [SETTING_KEY]: setting }}
        value={settings[setting]}
        onChange={change}
        className={`w-64 cursor-pointer accent-white ${FOCUS_RING}`}
      />
    </label>
  )
}

function MenuButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      {...{ [MENU_ROW]: "", [MENU_CONTROL]: "" }}
      onClick={onClick}
      className={BUTTON}
    >
      {children}
    </button>
  )
}
