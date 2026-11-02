import { eventChannel } from "@/events/eventChannel"

export const LANGUAGE_PICKER = "data-language-picker"

export const LANGUAGE_OPTION = "data-language-option"

export type ListSteering = { down: number; press: boolean; back: boolean }

const changes = eventChannel<string | null>()

let openPicker: string | null = null

export const languageListEvents = { listen: changes.listen }

export function languageListOpen() {
  return openPicker !== null
}

export function openListOf() {
  return openPicker
}

export function toggleLanguageList(picker: string) {
  setOpenPicker(openPicker === picker ? null : picker)
}

export function closeLanguageList() {
  setOpenPicker(null)
}

export function steerLanguageList({ down, press, back }: ListSteering) {
  if (back) closeLanguageList()
  else if (press) pressFocusedOption()
  else if (down) moveOptionFocus(down)
}

export function moveOptionFocus(step: number) {
  const options = openOptions()
  if (options.length === 0) return
  const current = options.indexOf(document.activeElement as HTMLElement)
  const next = current < 0 ? 0 : (current + step + options.length) % options.length
  focusVisibly(options[next])
}

export function focusChosenOption() {
  const options = openOptions()
  const chosen = options.find((option) => option.getAttribute("aria-selected") === "true")
  const target = chosen ?? options[0]
  if (target) focusVisibly(target)
}

function pressFocusedOption() {
  const focused = document.activeElement
  if (focused instanceof HTMLElement && openOptions().includes(focused)) focused.click()
}

function openOptions() {
  if (openPicker === null) return []
  return [
    ...document.querySelectorAll<HTMLElement>(`[${LANGUAGE_OPTION}="${CSS.escape(openPicker)}"]`),
  ]
}

function focusVisibly(element: HTMLElement) {
  element.focus({ focusVisible: true } as FocusOptions)
}

function setOpenPicker(next: string | null) {
  if (openPicker === next) return
  openPicker = next
  changes.emit(next)
}
