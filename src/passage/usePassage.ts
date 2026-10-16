import { useThree } from "@react-three/fiber"
import { type RapierRigidBody, useAfterPhysicsStep } from "@react-three/rapier"
import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react"
import { type Euler, MathUtils, Vector3 } from "three"
import { endLoop, nightState } from "@/night/night"
import { nightEvents } from "@/night/nightEvents"
import type { Way } from "@/night/loops"
import {
  type Doorway,
  DOORWAYS,
  doorFrameMatrix,
  type Room,
  roomAxes,
  roomOfDoorway,
  wrapIntoStartRoom,
} from "@/safeRoom/safeRooms"
import { loopState, type Whereabouts } from "./loopState"
import {
  forwardOf,
  passageMoment,
  passageShape,
  type PassageRoute,
  type PassageShape,
  type Pose,
  wrappedAngle,
} from "./passage"
import { startRoomSpawn } from "./spawn"
import { usePassageControls } from "./usePassageControls"
import { usePassageTuning } from "./usePassageTuning"
import { usePromptTuning } from "./usePromptTuning"

export type PlayerRig = {
  body: RefObject<RapierRigidBody | null>
  view: RefObject<Euler>
  eyeHeight: number
}

type DoorChoice = { doorway: Doorway; entering: boolean }

type Passage = DoorChoice & {
  room: Room
  route: PassageRoute
  shape: PassageShape
  startedAt: number
}

type DoorTarget = DoorChoice & { center: Vector3; heading: Vector3; awayFromHinge: Vector3 }

const DOOR_CHOICES: Record<Whereabouts, DoorChoice[]> = {
  startRoom: [{ doorway: "startNear", entering: false }],
  house: [
    { doorway: "startNear", entering: true },
    { doorway: "endNear", entering: true },
  ],
}

const WAY_THROUGH: Partial<Record<Doorway, Way>> = { startNear: "back", endNear: "ahead" }

const OPENS_INTO_ROOM = 1

const OPENS_OUT_OF_ROOM = -1

const LEVEL_PITCH = 0

const HIDDEN = 0

const SHOWN = 1

export function usePassage(rig: PlayerRig, prompt: RefObject<HTMLElement | null>, viewed: boolean) {
  const camera = useThree((state) => state.camera)
  const readControls = usePassageControls()
  const tuning = usePassageTuning()
  const promptTuning = usePromptTuning()
  const doors = useMemo(doorTargets, [])
  const passage = useRef<Passage | null>(null)
  const heldPose = useRef<Pose | null>(null)
  const releaseAfterStep = useRef(false)
  const promptShown = useRef(HIDDEN)

  useAfterPhysicsStep(() => {
    if (!releaseAfterStep.current) return
    releaseAfterStep.current = false
    heldPose.current = null
  })

  const fadePrompt = useCallback(
    (target: number, delta: number) => {
      const step = delta / promptTuning.fade
      const shown = MathUtils.clamp(target, promptShown.current - step, promptShown.current + step)
      if (shown === promptShown.current) return
      promptShown.current = shown
      if (prompt.current) prompt.current.style.opacity = String(shown)
    },
    [prompt, promptTuning.fade],
  )

  const begin = useCallback(
    (door: DoorTarget, time: number) => {
      const room = roomOfDoorway(door.doorway)
      const from = {
        eye: camera.position.clone(),
        yaw: rig.view.current.y,
        pitch: rig.view.current.x,
      }
      passage.current = {
        doorway: door.doorway,
        entering: door.entering,
        room,
        route: {
          from,
          doorCenter: door.center,
          heading: door.heading,
          awayFromHinge: door.awayFromHinge,
        },
        shape: passageShape(tuning.lineUp, tuning.through, tuning),
        startedAt: time,
      }
      if (door.entering) loopState.lampRoom = room
      loopState.passing = true
      rig.body.current?.setEnabled(false)
    },
    [camera, rig, tuning],
  )

  const drive = useCallback(
    (running: Passage, progress: number) => {
      const { pose, opened, closed } = passageMoment(
        running.route,
        running.shape,
        tuning.timing,
        progress,
      )
      const swing = running.entering ? OPENS_INTO_ROOM : OPENS_OUT_OF_ROOM
      loopState.leafAngles[running.doorway] = swing * tuning.openAngle * opened * (1 - closed)
      loopState.lampLevel = running.entering ? opened : 1 - closed
      loopState.houseLevel = running.entering ? 1 - closed : opened
      heldPose.current = pose
    },
    [tuning],
  )

  const finish = useCallback(
    (running: Passage, pose: Pose) => {
      loopState.leafAngles[running.doorway] = 0
      const arrived = running.entering ? wrapped(pose, running.room) : pose
      Object.assign(loopState, arrivalState(running.entering))
      placeBody(rig, arrived)
      heldPose.current = arrived
      releaseAfterStep.current = true
      passage.current = null
      const way = WAY_THROUGH[running.doorway]
      if (running.entering && way) endLoop(way)
    },
    [rig],
  )

  const respawn = useCallback(() => {
    passage.current = null
    for (const doorway of DOORWAYS) loopState.leafAngles[doorway] = 0
    Object.assign(loopState, arrivalState(true))
    const { feet, yaw } = startRoomSpawn()
    const spawned = {
      eye: new Vector3(feet[0], feet[1] + rig.eyeHeight, feet[2]),
      yaw,
      pitch: LEVEL_PITCH,
    }
    placeBody(rig, spawned)
    heldPose.current = spawned
    releaseAfterStep.current = true
  }, [rig])

  useEffect(
    () =>
      nightEvents.listen((event) => {
        if (event.kind === "newNight") respawn()
      }),
    [respawn],
  )

  const update = useCallback(
    (time: number, delta: number) => {
      const { open } = readControls()
      if (nightState.phase === "dawn") {
        fadePrompt(HIDDEN, delta)
        return true
      }
      const running = passage.current
      if (running) {
        const progress = Math.min((time - running.startedAt) / tuning.duration, 1)
        drive(running, progress)
        if (progress >= 1) finish(running, heldPose.current!)
        fadePrompt(HIDDEN, delta)
        return true
      }
      const door = viewed
        ? reachableDoor(doors, camera.position, rig.view.current.y, promptTuning)
        : null
      fadePrompt(door ? SHOWN : HIDDEN, delta)
      if (door && open) begin(door, time)
      return passage.current !== null || heldPose.current !== null
    },
    [
      readControls,
      tuning.duration,
      drive,
      finish,
      fadePrompt,
      viewed,
      doors,
      camera,
      rig,
      promptTuning,
      begin,
    ],
  )

  const cameraPose = useCallback(() => heldPose.current, [])

  return { update, cameraPose }
}

function doorTargets(): Record<Whereabouts, DoorTarget[]> {
  return Object.fromEntries(
    Object.entries(DOOR_CHOICES).map(([whereabouts, choices]) => [
      whereabouts,
      choices.map((choice) => {
        const { inward, awayFromHinge } = roomAxes(roomOfDoorway(choice.doorway))
        return {
          ...choice,
          center: new Vector3().setFromMatrixPosition(doorFrameMatrix(choice.doorway)),
          heading: choice.entering ? inward : inward.clone().negate(),
          awayFromHinge,
        }
      }),
    ]),
  ) as Record<Whereabouts, DoorTarget[]>
}

function reachableDoor(
  doors: Record<Whereabouts, DoorTarget[]>,
  eye: Vector3,
  yaw: number,
  { reach, facing }: { reach: number; facing: number },
) {
  return (
    doors[loopState.whereabouts].find(({ center, heading }) => {
      const toDoor = center.clone().sub(eye).setY(0)
      if (toDoor.length() > reach || toDoor.dot(heading) <= 0) return false
      return forwardOf(yaw).angleTo(toDoor) <= MathUtils.degToRad(facing)
    }) ?? null
  )
}

function placeBody(rig: PlayerRig, pose: Pose) {
  const body = rig.body.current
  if (body) {
    body.setTranslation({ x: pose.eye.x, y: pose.eye.y - rig.eyeHeight, z: pose.eye.z }, true)
    body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.setEnabled(true)
  }
  rig.view.current.set(pose.pitch, wrappedAngle(pose.yaw), 0)
}

function wrapped(pose: Pose, room: Room): Pose {
  const { matrix, turn } = wrapIntoStartRoom(room)
  return { eye: pose.eye.clone().applyMatrix4(matrix), yaw: pose.yaw + turn, pitch: pose.pitch }
}

function arrivalState(entering: boolean) {
  return entering
    ? {
        whereabouts: "startRoom" as const,
        passing: false,
        startRoomFarDoor: false,
        lampRoom: "start" as const,
        lampLevel: 1,
        houseLevel: 0,
      }
    : {
        whereabouts: "house" as const,
        passing: false,
        startRoomFarDoor: true,
        lampLevel: 0,
        houseLevel: 1,
      }
}
