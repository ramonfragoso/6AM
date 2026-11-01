import { audioEngine, preloadSounds } from "@/sound/audioEngine"
import { type PlayingSound, startSound } from "@/sound/playSound"

type EndingMusic = { playing: PlayingSound | null; startedAt: number }

const ENDING_MUSIC = "endingMusic"

const music: EndingMusic = { playing: null, startedAt: 0 }

export function preloadEndingMusic() {
  preloadSounds([ENDING_MUSIC])
}

export function startEndingMusic(from: number, fadeIn: number) {
  const engine = audioEngine()
  const playing = engine ? startSound(ENDING_MUSIC, { delay: -from, fadeIn }) : null
  if (!engine || !playing) return false
  music.playing = playing
  music.startedAt = engine.context.currentTime - from
  return true
}

export function endingMusicSeconds() {
  const engine = audioEngine()
  if (!engine || !music.playing) return null
  const { context } = engine
  const latency = (context.outputLatency || 0) + (context.baseLatency || 0)
  return context.currentTime - music.startedAt - latency
}

export function stopEndingMusic() {
  music.playing?.stop()
  music.playing = null
}
