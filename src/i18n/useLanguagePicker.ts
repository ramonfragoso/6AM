import {
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
import { setLanguage, useLanguage } from "./language"
import {
  closeLanguageList,
  focusChosenOption,
  languageListEvents,
  moveOptionFocus,
  openListOf,
  toggleLanguageList,
} from "./languageList"
import type { Language } from "./languages"

const KEY_STEPS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 }

const ESCAPE = "Escape"

export function useLanguagePicker() {
  const picker = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const language = useLanguage()
  const open = useListOpen(picker, root, trigger)

  useCloseOnOutsidePress(root, open)
  useCloseOnUnmount(picker)

  const toggle = useCallback(() => toggleLanguageList(picker), [picker])

  const choose = useCallback((chosen: Language) => {
    setLanguage(chosen)
    closeLanguageList()
  }, [])

  const handleListKey = useCallback((event: KeyboardEvent) => {
    const step = KEY_STEPS[event.key]
    if (step) {
      event.preventDefault()
      moveOptionFocus(step)
    } else if (event.key === ESCAPE) {
      event.preventDefault()
      event.stopPropagation()
      closeLanguageList()
    }
  }, [])

  return {
    picker,
    root,
    trigger,
    language,
    open,
    toggle,
    choose,
    handleListKey,
  }
}

function useListOpen(
  picker: string,
  root: RefObject<HTMLElement | null>,
  trigger: RefObject<HTMLElement | null>,
) {
  const [open, setOpen] = useState(() => openListOf() === picker)
  const wasOpen = useRef(open)

  useEffect(
    () =>
      languageListEvents.listen((openPicker) => {
        const opened = openPicker === picker
        if (wasOpen.current && !opened && focusWasInside(root.current)) {
          trigger.current?.focus({ focusVisible: true } as FocusOptions)
        }
        wasOpen.current = opened
        setOpen(opened)
        if (opened) requestAnimationFrame(focusChosenOption)
      }),
    [picker, root, trigger],
  )

  return open
}

function focusWasInside(root: HTMLElement | null) {
  const focused = document.activeElement
  return !focused || focused === document.body || Boolean(root?.contains(focused))
}

function useCloseOnOutsidePress(root: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return
    const handlePress = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) closeLanguageList()
    }
    document.addEventListener("pointerdown", handlePress)
    return () => document.removeEventListener("pointerdown", handlePress)
  }, [root, open])
}

function useCloseOnUnmount(picker: string) {
  useEffect(
    () => () => {
      if (openListOf() === picker) closeLanguageList()
    },
    [picker],
  )
}
