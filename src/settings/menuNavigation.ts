import { MathUtils } from "three"
import { cycleLanguage } from "@/i18n/language"
import { LANGUAGE_PICKER } from "@/i18n/languageList"
import { updateSettings } from "./gameSettings"

export const MENU_ROW = "data-menu-row"

export const MENU_CONTROL = "data-menu-control"

export const MENU_SCROLL = "data-menu-scroll"

export const SETTING_KEY = "data-setting"

const SLIDER_STEP = 0.05

const RIGHT_TO_LEFT = "rtl"

type SliderSetting = "sensitivity" | "volume"

export function focusFirstRow(menu: HTMLElement) {
  const [first] = rowsOf(menu)
  if (first) focusRow(first)
}

export function moveFocus(menu: HTMLElement, step: number) {
  const rows = rowsOf(menu)
  if (rows.length === 0) return
  const current = rows.findIndex((row) => row.contains(document.activeElement))
  const next = current < 0 ? 0 : MathUtils.euclideanModulo(current + step, rows.length)
  focusRow(rows[next])
}

export function adjustFocused(menu: HTMLElement, step: number) {
  const focused = document.activeElement
  if (!(focused instanceof HTMLElement) || !menu.contains(focused)) return
  if (focused.hasAttribute(LANGUAGE_PICKER)) {
    cycleLanguage(step)
    return
  }
  const onScreen = rightToLeft(focused) ? -step : step
  if (focused instanceof HTMLInputElement && focused.type === "range") {
    const setting = focused.getAttribute(SETTING_KEY) as SliderSetting
    const value = MathUtils.clamp(Number(focused.value) + onScreen * SLIDER_STEP, 0, 1)
    updateSettings({ [setting]: value })
    return
  }
  if (focused.getAttribute("role") !== "radio") return
  const options = controlsOf(focused.closest(`[${MENU_ROW}]`))
  const next = options[MathUtils.clamp(options.indexOf(focused) + onScreen, 0, options.length - 1)]
  next?.click()
  if (next) focusVisibly(next)
}

export function pressFocused(menu: HTMLElement) {
  const focused = document.activeElement
  if (focused instanceof HTMLElement && menu.contains(focused)) focused.click()
  else focusFirstRow(menu)
}

export function scrollMenu(menu: HTMLElement, pixels: number) {
  const scrolled = menu.querySelector(`[${MENU_SCROLL}]`)
  if (scrolled) scrolled.scrollTop += pixels
}

function rightToLeft(element: HTMLElement) {
  return getComputedStyle(element).direction === RIGHT_TO_LEFT
}

function rowsOf(menu: HTMLElement) {
  return [...menu.querySelectorAll<HTMLElement>(`[${MENU_ROW}]`)]
}

function controlsOf(row: Element | null) {
  return row ? [...row.querySelectorAll<HTMLElement>(`[${MENU_CONTROL}]`)] : []
}

function focusRow(row: HTMLElement) {
  const controls = controlsOf(row)
  const chosen = controls.find((control) => control.getAttribute("aria-checked") === "true")
  const target = chosen ?? controls[0] ?? row
  focusVisibly(target)
}

function focusVisibly(element: HTMLElement) {
  element.focus({ focusVisible: true } as FocusOptions)
}
