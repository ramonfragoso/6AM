"use client"

import { OrbitControls } from "@react-three/drei"
import { Physics } from "@react-three/rapier"
import { Leva } from "leva"
import { Suspense } from "react"
import type { Vector3Tuple } from "three"
import { useDebugMode } from "@/debug/useDebugMode"
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
  far: 3000,
}

const BACKGROUND_COLOR = "#000000"

export function World() {
  return (
    <main className="h-screen w-full">
      <div className="absolute top-1 right-1 z-50 max-w-[370px] overflow-auto rounded-md">
        <Leva fill />
      </div>
      <WebGPUCanvas dpr={PIXEL_RATIO} camera={INITIAL_CAMERA} shadows>
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
    </>
  )
}
