import { startTransition, useEffect, useRef, useState } from "react"
import { KIT_URL } from "./kitPieces"

const KIT_VERSION_ENDPOINT = "/api/kit-version"

const POLL_INTERVAL_MS = 2000

const WATCHES_KIT = process.env.NODE_ENV === "development"

export function useKitUrl() {
  const [url, setUrl] = useState(KIT_URL)
  const seenVersion = useRef<number | null>(null)

  useEffect(() => {
    if (!WATCHES_KIT) return
    let active = true
    const check = async () => {
      const version = await fetchKitVersion()
      if (!active || version === null || version === seenVersion.current) return
      const isFirstLook = seenVersion.current === null
      seenVersion.current = version
      if (!isFirstLook) startTransition(() => setUrl(`${KIT_URL}?v=${version}`))
    }
    void check()
    const timer = setInterval(check, POLL_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  return url
}

async function fetchKitVersion(): Promise<number | null> {
  try {
    const response = await fetch(KIT_VERSION_ENDPOINT, { cache: "no-store" })
    if (!response.ok) return null
    const body = (await response.json()) as { version: number }
    return body.version
  } catch {
    return null
  }
}
