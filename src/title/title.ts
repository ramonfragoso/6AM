import { eventChannel } from "@/events/eventChannel"

export type TitleStage = "loading" | "shown" | "opening" | "playing"

const MILLISECONDS = 1000

export const title = { stage: "loading" as TitleStage, openedAt: 0 }

export const titleEvents = eventChannel<TitleStage>()

export function showTitle() {
  if (title.stage === "loading") moveTo("shown")
}

export function beginOpening() {
  if (title.stage !== "shown") return
  title.openedAt = titleClock()
  moveTo("opening")
}

export function startPlaying() {
  if (title.stage === "opening") moveTo("playing")
}

export function playing() {
  return title.stage === "playing"
}

export function titleClock() {
  return performance.now() / MILLISECONDS
}

function moveTo(stage: TitleStage) {
  title.stage = stage
  titleEvents.emit(stage)
}
