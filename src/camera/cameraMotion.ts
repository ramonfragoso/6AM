import { MathUtils, Vector3 } from "three"

export type CameraMotionSettings = {
  intensity: number
  stepsPerMeter: number
  bobHeight: number
  bobSway: number
  bobRoll: number
  stepVariation: number
  blendRate: number
  walkingSpeed: number
  breathHeight: number
  breathPitch: number
  breathRate: number
  breathSecondRate: number
  driftSway: number
  driftRoll: number
  driftRate: number
}

export type Gait = { delta: number; speed: number; grounded: boolean }

export type CameraOffset = { position: Vector3; pitch: number; roll: number }

type Phases = {
  breath: number
  breathSecond: number
  driftSway: number
  driftRoll: number
}

export type CameraMotion = {
  phase: number
  idleTime: number
  bobStrength: number
  stepAmplitude: number
  step: number
  footfall: number
  phases: Phases
  offset: CameraOffset
}

const FULL_TURN = Math.PI * 2

const PHASE_PER_STEP = Math.PI

const LOWEST_POINT = (3 * Math.PI) / 4

const STANDING_SPEED = 0.1

const MAX_DELTA = 0.1

const BREATH_SECOND_SHARE = 0.6

const DRIFT_SECOND_RATIO = 1.618

const DRIFT_THIRD_RATIO = 0.53

export function createCameraMotion(random: () => number = Math.random): CameraMotion {
  return {
    phase: 0,
    idleTime: 0,
    bobStrength: 0,
    stepAmplitude: 1,
    step: 0,
    footfall: footfallOf(0),
    phases: {
      breath: random() * FULL_TURN,
      breathSecond: random() * FULL_TURN,
      driftSway: random() * FULL_TURN,
      driftRoll: random() * FULL_TURN,
    },
    offset: { position: new Vector3(), pitch: 0, roll: 0 },
  }
}

export function advanceCameraMotion(
  motion: CameraMotion,
  { delta, speed, grounded }: Gait,
  settings: CameraMotionSettings,
  onStep: () => void,
  random: () => number = Math.random,
): CameraOffset {
  const dt = Math.min(delta, MAX_DELTA)
  const walking = grounded ? MathUtils.smoothstep(speed, STANDING_SPEED, settings.walkingSpeed) : 0
  motion.bobStrength = MathUtils.damp(motion.bobStrength, walking, settings.blendRate, dt)
  motion.idleTime += dt
  if (grounded) motion.phase += speed * settings.stepsPerMeter * PHASE_PER_STEP * dt
  holdStepAmplitude(motion, settings.stepVariation, random)
  if (grounded && speed > STANDING_SPEED) stepOnFootfall(motion, onStep)
  else motion.footfall = footfallOf(motion.phase)
  return writeOffset(motion, settings)
}

function holdStepAmplitude(motion: CameraMotion, variation: number, random: () => number) {
  const step = Math.floor(motion.phase / PHASE_PER_STEP)
  if (step === motion.step) return
  motion.step = step
  motion.stepAmplitude = 1 + (random() * 2 - 1) * variation
}

function stepOnFootfall(motion: CameraMotion, onStep: () => void) {
  const footfall = footfallOf(motion.phase)
  if (footfall > motion.footfall) onStep()
  motion.footfall = footfall
}

function footfallOf(phase: number) {
  return Math.floor((phase - LOWEST_POINT) / PHASE_PER_STEP)
}

function writeOffset(motion: CameraMotion, settings: CameraMotionSettings): CameraOffset {
  const { phase, idleTime, phases, offset } = motion
  const walk = motion.bobStrength * motion.stepAmplitude * settings.intensity
  const idle = (1 - motion.bobStrength) * settings.intensity
  const breath = breathing(idleTime, phases, settings)
  const drift = FULL_TURN * settings.driftRate * idleTime
  offset.position.set(
    walk * settings.bobSway * Math.sin(phase) +
      idle * settings.driftSway * slowWave(drift, phases.driftSway),
    walk * settings.bobHeight * Math.sin(phase * 2) + idle * settings.breathHeight * breath,
    0,
  )
  offset.pitch = idle * MathUtils.degToRad(settings.breathPitch) * breath
  offset.roll =
    walk * MathUtils.degToRad(settings.bobRoll) * Math.sin(phase) +
    idle * MathUtils.degToRad(settings.driftRoll) * slowWave(drift, phases.driftRoll)
  return offset
}

function breathing(time: number, phases: Phases, settings: CameraMotionSettings) {
  const first = Math.sin(FULL_TURN * settings.breathRate * time + phases.breath)
  const second = Math.sin(FULL_TURN * settings.breathSecondRate * time + phases.breathSecond)
  return (first + BREATH_SECOND_SHARE * second) / (1 + BREATH_SECOND_SHARE)
}

function slowWave(angle: number, phase: number) {
  const layered =
    Math.sin(angle + phase) +
    Math.sin(angle * DRIFT_SECOND_RATIO + phase * 2) / 2 +
    Math.sin(angle * DRIFT_THIRD_RATIO + phase * 3) / 3
  return layered / (1 + 1 / 2 + 1 / 3)
}
