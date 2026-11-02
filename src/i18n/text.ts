import type { GameText } from "./gameText"
import { currentLanguage, useLanguage } from "./language"
import { directionOf, type Language } from "./languages"
import { ar } from "./translations/ar"
import { en } from "./translations/en"
import { es } from "./translations/es"
import { fr } from "./translations/fr"
import { hi } from "./translations/hi"
import { ja } from "./translations/ja"
import { ptBR } from "./translations/ptBR"
import { zhCN } from "./translations/zhCN"

const TEXTS: Record<Language, GameText> = {
  en,
  "pt-BR": ptBR,
  es,
  fr,
  hi,
  "zh-CN": zhCN,
  ja,
  ar,
}

const COUNT_PLACEHOLDER = "{count}"

export function currentText() {
  return TEXTS[currentLanguage()]
}

export function useText() {
  const language = useLanguage()
  return { text: TEXTS[language], language, dir: directionOf(language) }
}

export function hauntCountText(count: number) {
  const language = currentLanguage()
  const forms = TEXTS[language].reading.hauntCount
  const form = new Intl.PluralRules(language).select(count)
  return (forms[form] ?? forms.other).replace(COUNT_PLACEHOLDER, String(count))
}
