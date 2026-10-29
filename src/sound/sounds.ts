export const BUSES = ["effects", "ambience", "music"] as const

export type Bus = (typeof BUSES)[number]

export type SoundSpec = { url: string; bus: Bus; volume: number }

export const SOUNDS = {
  clockTick: { url: "/sounds/clock/clock_tick.ogg", bus: "effects", volume: 0.35 },
  clockBug: { url: "/sounds/clock/clock_bug.ogg", bus: "effects", volume: 0.3 },
  clockRing: { url: "/sounds/clock/clock_ring.ogg", bus: "effects", volume: 0.5 },
  candle: { url: "/sounds/fire/candle.ogg", bus: "ambience", volume: 1 },
  ambientLoop: { url: "/sounds/ambience/ambient_loop.ogg", bus: "ambience", volume: 0.25 },
  ambientLoop2: { url: "/sounds/ambience/ambient_loop2.ogg", bus: "ambience", volume: 0.2 },
  doorOpening: { url: "/sounds/passage/door_opening.ogg", bus: "effects", volume: 0.8 },
  woodStep: { url: "/sounds/steps/wood_step.ogg", bus: "effects", volume: 0.5 },
  tileStep: { url: "/sounds/steps/tile_step.ogg", bus: "effects", volume: 0.5 },
  woodCreak: { url: "/sounds/creaks/wood_creak.ogg", bus: "effects", volume: 0.6 },
  woodCreak2: { url: "/sounds/creaks/wood_creak2.ogg", bus: "effects", volume: 0.6 },
  woodCreak3: { url: "/sounds/creaks/wood_creak3.ogg", bus: "effects", volume: 0.6 },
  pianoSting: { url: "/sounds/stings/piano_sting.ogg", bus: "music", volume: 0.6 },
  pianoSting2: { url: "/sounds/stings/piano_sting2.ogg", bus: "music", volume: 0.6 },
  violinStinger: { url: "/sounds/stings/violin_stinger.ogg", bus: "music", volume: 0.6 },
  violinStinger2: { url: "/sounds/stings/violin_stinger2.ogg", bus: "music", volume: 0.5 },
  violinStinger3: { url: "/sounds/stings/violin_stinger3.ogg", bus: "music", volume: 0.6 },
  jumpscare: { url: "/sounds/stings/jumpscare.ogg", bus: "effects", volume: 0.6 },
  endingMusic: { url: "/sounds/music/ending_music.ogg", bus: "music", volume: 0.5 },
  angryDoorSlam: { url: "/sounds/haunts/angry_door_slam.ogg", bus: "effects", volume: 0.9 },
  doorSlam: { url: "/sounds/haunts/door_slam.ogg", bus: "effects", volume: 0.8 },
  chairMove: { url: "/sounds/haunts/chair_move.ogg", bus: "effects", volume: 0.6 },
  crawlingBug: { url: "/sounds/haunts/crawling_bug.ogg", bus: "effects", volume: 0.5 },
} satisfies Record<string, SoundSpec>

export type SoundName = keyof typeof SOUNDS
