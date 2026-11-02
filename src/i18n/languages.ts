export const LANGUAGES = ["en", "pt-BR", "es", "fr", "hi", "zh-CN", "ja", "ar"] as const

export type Language = (typeof LANGUAGES)[number]

export type TextDirection = "ltr" | "rtl"

export const DEFAULT_LANGUAGE: Language = "en"

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  "pt-BR": "Português",
  es: "Español",
  fr: "Français",
  hi: "हिन्दी",
  "zh-CN": "简体中文",
  ja: "日本語",
  ar: "العربية",
}

const RIGHT_TO_LEFT: readonly Language[] = ["ar"]

export function directionOf(language: Language): TextDirection {
  return RIGHT_TO_LEFT.includes(language) ? "rtl" : "ltr"
}

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}

export function matchLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const exact = LANGUAGES.find((language) => language.toLowerCase() === tag.toLowerCase())
    if (exact) return exact
    const base = baseOf(tag)
    const sameBase = LANGUAGES.find((language) => baseOf(language) === base)
    if (sameBase) return sameBase
  }
  return DEFAULT_LANGUAGE
}

function baseOf(tag: string) {
  return tag.toLowerCase().split("-")[0]
}
