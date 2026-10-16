export const BUSES = ["effects", "ambience", "music"] as const

export type Bus = (typeof BUSES)[number]

export type SoundSpec = { url: string; bus: Bus; volume: number }

export const SOUNDS = {
  clockTick: { url: "/sounds/clock/tick.ogg", bus: "effects", volume: 1 },
  clockTock: { url: "/sounds/clock/tock.ogg", bus: "effects", volume: 1 },
  clockClunk: { url: "/sounds/clock/clunk.ogg", bus: "effects", volume: 1 },
  clockGlitch: { url: "/sounds/clock/glitch.ogg", bus: "effects", volume: 0.35 },
  clockRing: { url: "/sounds/clock/ring.ogg", bus: "effects", volume: 0.7 },
} satisfies Record<string, SoundSpec>

export type SoundName = keyof typeof SOUNDS
