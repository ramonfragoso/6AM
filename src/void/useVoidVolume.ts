import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { setRoomVolume } from "@/safeRoom/safeRoomVolumes"
import { VOID_ROOM, voidOpen } from "./voidOpen"
import { VOID_VOLUME } from "./voidSpace"

export function useVoidVolume() {
  const shownOpen = useRef<boolean | null>(null)

  useFrame(() => {
    const open = voidOpen()
    if (open === shownOpen.current) return
    shownOpen.current = open
    setRoomVolume(VOID_ROOM, open ? VOID_VOLUME : undefined)
  })

  useEffect(() => () => setRoomVolume(VOID_ROOM), [])
}
