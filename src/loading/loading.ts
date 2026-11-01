import { downloadedShare, parsedShare } from "./downloads"

export type LoadingStage = "loading" | "compiling" | "warming" | "ready"

const DOWNLOAD_SHARE = 0.8

const PARSE_SHARE = 0.05

const COMPILE_SHARE = 0.12

const WARM_SHARE = 1 - DOWNLOAD_SHARE - PARSE_SHARE - COMPILE_SHARE

export const loading = {
  stage: "loading" as LoadingStage,
  waitingBoundaries: 0,
  compiled: 0,
  warmed: 0,
}

export function loadedShare() {
  return (
    DOWNLOAD_SHARE * downloadedShare() +
    PARSE_SHARE * (loading.stage === "loading" ? parsedShare() : 1) +
    COMPILE_SHARE * loading.compiled +
    WARM_SHARE * loading.warmed
  )
}

export function drawsScene() {
  return loading.stage !== "loading"
}

export function loadingDone() {
  return loading.stage === "ready"
}
