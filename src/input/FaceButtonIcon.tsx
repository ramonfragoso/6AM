import type { ReactNode } from "react"
import type { GamepadFamily } from "./gamepad"

type FaceButtonIconProps = { device: GamepadFamily; pulsing?: boolean; children: ReactNode }

const SHOWN_FOR: Record<GamepadFamily, string> = {
  xbox: "group-data-[device=xbox]:block",
  playstation: "group-data-[device=playstation]:block",
}

const PULSING = "animate-click origin-center [transform-box:fill-box]"

export function FaceButtonIcon({ device, pulsing = false, children }: FaceButtonIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      strokeLinecap="round"
      className={`col-start-1 row-start-1 hidden size-full ${SHOWN_FOR[device]}`}
    >
      <g className={pulsing ? PULSING : undefined}>
        <circle cx="12" cy="12" r="10" fill="rgb(0 0 0 / 0.55)" stroke="white" strokeWidth="1.5" />
        {children}
      </g>
    </svg>
  )
}
