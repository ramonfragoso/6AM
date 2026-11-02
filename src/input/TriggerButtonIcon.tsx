import type { GamepadFamily } from "./gamepad"

type TriggerButtonIconProps = { device: GamepadFamily; label: string; pulsing?: boolean }

const SHOWN_FOR: Record<GamepadFamily, string> = {
  xbox: "group-data-[device=xbox]:block",
  playstation: "group-data-[device=playstation]:block",
}

const PULSING = "animate-click origin-center [transform-box:fill-box]"

const TRIGGER_OUTLINE = "M6 21.5h12a1 1 0 0 0 1-1V10a7 7 0 0 0-14 0v10.5a1 1 0 0 0 1 1z"

export function TriggerButtonIcon({ device, label, pulsing = false }: TriggerButtonIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`col-start-1 row-start-1 hidden size-full ${SHOWN_FOR[device]}`}
    >
      <g className={pulsing ? PULSING : undefined}>
        <path d={TRIGGER_OUTLINE} fill="rgb(0 0 0 / 0.55)" stroke="white" strokeWidth="1.5" />
        <text
          x="12"
          y="16.5"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="7.5"
          fontWeight="bold"
          letterSpacing="0"
          fill="white"
        >
          {label}
        </text>
      </g>
    </svg>
  )
}
