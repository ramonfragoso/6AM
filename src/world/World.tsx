"use client"

import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import { Suspense, useRef, type RefObject } from "react"
import type { Vector3Tuple } from "three"
import { DEFAULT_FOV } from "@/camera/useCameraTuning"
import { FieldOfView } from "@/camera/FieldOfView"
import { useDebugMode } from "@/debug/useDebugMode"
import { DebugPlayer } from "@/debugPlayer/DebugPlayer"
import { DebugPlayerCoordinates } from "@/debugPlayer/DebugPlayerCoordinates"
import { Dust } from "@/dust/Dust"
import { Corridor } from "@/kit/Corridor"
import { Player } from "@/player/Player"
import { PostProcessing } from "@/postprocessing/PostProcessing"
import { useTuningPersistence } from "@/tuning/useTuningPersistence"
import { Lights } from "./Lights"
import { GRAVITY, PHYSICS_STEP_PRIORITY, PHYSICS_TIME_STEP } from "./physicsSettings"
import { WebGPUCanvas } from "./WebGPUCanvas"

const PIXEL_RATIO: [number, number] = [1, 2]

const INITIAL_CAMERA_POSITION: Vector3Tuple = [0, 0, 0]

const INITIAL_CAMERA = {
  position: INITIAL_CAMERA_POSITION,
  fov: DEFAULT_FOV,
  near: 0.1,
  far: 100,
}

const BACKGROUND_COLOR = "#000000"

const SOFT_SHADOWS = "percentage"

const TUNING_PANEL_HIDDEN = process.env.NODE_ENV !== "development"

const TUNING_PANEL_THEME = { sizes: { numberInputMinWidth: "48px" } }

const GAME_VIEW_LABEL = "Game view"

const NO_GRAPHICS_MESSAGE =
  "Your browser can't run 3D graphics. Try a recent version of Chrome, Edge, Firefox or Safari."

type SceneProps = { debugPlayerCoordinates: RefObject<HTMLOutputElement | null> }

export function World() {
  const debugPlayerCoordinates = useRef<HTMLOutputElement>(null)

  return (
    <main className="h-screen w-full">
      <div className="fixed top-1 right-1 z-50 max-h-[calc(100vh-0.5rem)] max-w-[370px] overflow-x-hidden overflow-y-auto overscroll-contain rounded-md">
        <Leva fill hidden={TUNING_PANEL_HIDDEN} theme={TUNING_PANEL_THEME} />
      </div>
      <DebugPlayerCoordinates ref={debugPlayerCoordinates} />
      <WebGPUCanvas
        dpr={PIXEL_RATIO}
        camera={INITIAL_CAMERA}
        shadows={SOFT_SHADOWS}
        role="img"
        aria-label={GAME_VIEW_LABEL}
        fallback={<NoGraphicsMessage />}
      >
        <color attach="background" args={[BACKGROUND_COLOR]} />
        <Suspense fallback={null}>
          <Scene debugPlayerCoordinates={debugPlayerCoordinates} />
        </Suspense>
      </WebGPUCanvas>
    </main>
  )
}

function Scene({ debugPlayerCoordinates }: SceneProps) {
  useTuningPersistence()
  const debugMode = useDebugMode()

  return (
    <>
      <Lights />
      <Physics
        debug={debugMode}
        timeStep={PHYSICS_TIME_STEP}
        gravity={GRAVITY}
        colliders={false}
        updatePriority={PHYSICS_STEP_PRIORITY}
      >
        <Corridor />
        <Player />
      </Physics>
      <Dust />
      <DebugPlayer coordinatesReadout={debugPlayerCoordinates} />
      <FieldOfView />
      <PostProcessing />
    </>
  )
}

function NoGraphicsMessage() {
  return (
    <p className="grid h-full place-items-center p-4 text-center text-white">
      {NO_GRAPHICS_MESSAGE}
    </p>
  )
}
