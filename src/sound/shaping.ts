export const OPEN_TONE = 20000

export const DARKEST_TONE = 200

const SEMITONES_PER_OCTAVE = 12

const BUTTERWORTH_Q_DB = -3.0103

export function rateOf(semitones: number) {
  return 2 ** (semitones / SEMITONES_PER_OCTAVE)
}

export function semitonesOf(rate: number) {
  return SEMITONES_PER_OCTAVE * Math.log2(rate)
}

export function randomSpread(spread: number) {
  return (Math.random() * 2 - 1) * spread
}

export function createTone(context: BaseAudioContext, frequency: number) {
  return new BiquadFilterNode(context, { type: "lowpass", frequency, Q: BUTTERWORTH_Q_DB })
}
