"use client"

import { OrbitControls } from "@react-three/drei"
import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import { Suspense } from "react"
import type { Vector3Tuple } from "three"
import { useDebugMode } from "@/debug/useDebugMode"
import { PostProcessing } from "@/postprocessing/PostProcessing"
import { useTuningPersistence } from "@/tuning/useTuningPersistence"
import { Lights } from "./Lights"
import { GRAVITY, PHYSICS_TIME_STEP } from "./physicsSettings"
import { WebGPUCanvas } from "./WebGPUCanvas"

const PIXEL_RATIO: [number, number] = [1, 2]

const INITIAL_CAMERA_POSITION: Vector3Tuple = [0, 2, 4]

const INITIAL_CAMERA = {
  position: INITIAL_CAMERA_POSITION,
  fov: 80,
  near: 0.1,
  far: 100,
}

const BACKGROUND_COLOR = "#000000"

const SOFT_SHADOWS = "percentage"

const TUNING_PANEL_HIDDEN = process.env.NODE_ENV !== "development"

const GAME_VIEW_LABEL = "Game view"

const NO_GRAPHICS_MESSAGE =
  "Your browser can't run 3D graphics. Try a recent version of Chrome, Edge, Firefox or Safari."

export function World() {
  return (
    <main className="h-screen w-full">
      <div className="absolute top-1 right-1 z-50 max-w-[370px] overflow-auto rounded-md">
        <Leva fill hidden={TUNING_PANEL_HIDDEN} />
      </div>
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
          <Scene />
        </Suspense>
      </WebGPUCanvas>
    </main>
  )
}

function Scene() {
  useTuningPersistence()
  const debugMode = useDebugMode()

  return (
    <>
      <Lights />
      <Physics debug={debugMode} timeStep={PHYSICS_TIME_STEP} gravity={GRAVITY} colliders={false}>
        {null}
      </Physics>
      <OrbitControls makeDefault />
      {/* eslint-disable-next-line granny-clone/no-comments */}
      {/* <PostProcessing /> */}
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
