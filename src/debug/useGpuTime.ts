import { useFrame, useThree } from "@react-three/fiber"
import { monitor, useControls } from "leva"
import { useEffect, useRef } from "react"
import type { WebGPURenderer } from "three/webgpu"
import { useDebugMode } from "./useDebugMode"

const TIMESTAMP_FEATURE = "timestamp-query"

const RENDER_TIMESTAMPS = "render"

const REPORT_SECONDS = 0.5

const MILLISECOND_DECIMALS = 2

const NOT_MEASURED = "Turn on Debug to measure"

const NOT_SUPPORTED = "This browser does not expose GPU timestamps"

type TimedBackend = { trackTimestamp: boolean }

type Get = (path: string) => unknown

const shownWithDebug = (get: Get) => Boolean(get("Debug.enabled"))

export function useGpuTime() {
  const renderer = useThree((state) => state.gl) as unknown as WebGPURenderer
  const debugMode = useDebugMode()
  const report = useRef(NOT_MEASURED)
  const measured = useRef({ total: 0, frames: 0, seconds: 0 })
  const resolving = useRef(false)
  const supported = renderer.hasFeature(TIMESTAMP_FEATURE)
  const measuring = debugMode && supported

  useControls("Debug", { gpuTime: monitor(report, { render: shownWithDebug } as any) })

  useEffect(() => {
    const backend = timedBackendOf(renderer)
    backend.trackTimestamp = measuring
    report.current = supported ? NOT_MEASURED : NOT_SUPPORTED
    measured.current = { total: 0, frames: 0, seconds: 0 }
    return () => void (backend.trackTimestamp = false)
  }, [renderer, measuring, supported])

  useFrame((_, delta) => {
    if (!measuring || !timedBackendOf(renderer).trackTimestamp) return
    measured.current.seconds += delta
    if (!resolving.current) {
      resolving.current = true
      void renderer.resolveTimestampsAsync(RENDER_TIMESTAMPS).then((milliseconds) => {
        resolving.current = false
        if (milliseconds === undefined) return
        measured.current.total += milliseconds
        measured.current.frames += 1
      })
    }
    const { total, frames, seconds } = measured.current
    if (seconds < REPORT_SECONDS || frames === 0) return
    report.current = `${(total / frames).toFixed(MILLISECOND_DECIMALS)} ms per frame`
    measured.current = { total: 0, frames: 0, seconds: 0 }
  })
}

function timedBackendOf(renderer: WebGPURenderer) {
  return renderer.backend as unknown as TimedBackend
}
