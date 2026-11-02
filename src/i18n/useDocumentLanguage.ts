import { useEffect } from "react"
import { useLanguage } from "./language"

export function useDocumentLanguage() {
  const language = useLanguage()

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])
}
