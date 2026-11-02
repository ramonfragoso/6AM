const DAWNS_KEY = "6am.dawns"

const NONE = 0

export function dawnsReached() {
  try {
    return Number(localStorage.getItem(DAWNS_KEY)) || NONE
  } catch {
    return NONE
  }
}

export function recordDawn() {
  try {
    localStorage.setItem(DAWNS_KEY, String(dawnsReached() + 1))
  } catch {}
}
