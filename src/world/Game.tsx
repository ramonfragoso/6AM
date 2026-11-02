"use client"

import dynamic from "next/dynamic"
import { useLeaveTracking } from "@/analytics/useLeaveTracking"
import type { GameAsset } from "@/loading/downloads"
import { LoadingScreen } from "@/loading/LoadingScreen"

const World = dynamic(() => import("./World").then((loaded) => loaded.World), { ssr: false })

export function Game({ assets }: { assets: readonly GameAsset[] }) {
  useLeaveTracking()

  return (
    <>
      <World />
      <LoadingScreen assets={assets} />
    </>
  )
}
