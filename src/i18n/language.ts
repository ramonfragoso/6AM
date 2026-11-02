import { useSyncExternalStore } from "react"
import { eventChannel } from "@/events/eventChannel"
import { DEFAULT_LANGUAGE, isLanguage, type Language, LANGUAGES, matchLanguage } from "./languages"

const STORAGE_KEY = "6am.language"

const changes = eventChannel<Language>()

let language: Language = DEFAULT_LANGUAGE

let loaded = false

export function currentLanguage() {
  if (!loaded) {
    loaded = true
    language = loadLanguage()
  }
  return language
}

export function setLanguage(chosen: Language) {
  language = chosen
  loaded = true
  saveLanguage(chosen)
  changes.emit(chosen)
}

export function cycleLanguage(step: number) {
  const index = LANGUAGES.indexOf(currentLanguage())
  const next = (index + step + LANGUAGES.length) % LANGUAGES.length
  setLanguage(LANGUAGES[next])
}

export function useLanguage() {
  return useSyncExternalStore(changes.listen, currentLanguage, defaultLanguage)
}

function defaultLanguage() {
  return DEFAULT_LANGUAGE
}

function loadLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLanguage(stored)) return stored
  } catch {}
  return browserLanguage()
}

function browserLanguage(): Language {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE
  return matchLanguage(navigator.languages?.length ? navigator.languages : [navigator.language])
}

function saveLanguage(chosen: Language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, chosen)
  } catch {}
}
