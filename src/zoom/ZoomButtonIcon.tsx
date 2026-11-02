import { TriggerButtonIcon } from "@/input/TriggerButtonIcon"

const XBOX_RIGHT_TRIGGER = "RT"

const PLAYSTATION_RIGHT_TRIGGER = "R2"

export function ZoomButtonIcon() {
  return (
    <span className="grid size-9 place-items-center [filter:drop-shadow(0_0_6px_rgb(0_0_0/0.9))]">
      <MouseClickIcon />
      <TriggerButtonIcon device="xbox" label={XBOX_RIGHT_TRIGGER} pulsing />
      <TriggerButtonIcon device="playstation" label={PLAYSTATION_RIGHT_TRIGGER} pulsing />
    </span>
  )
}

function MouseClickIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="col-start-1 row-start-1 hidden size-9 group-data-[device=mouse]:block"
    >
      <g className="animate-click-rays">
        <path d="M14 4.1 12 6" />
        <path d="m5.1 8-2.9-.8" />
        <path d="m6 12-1.9 2" />
        <path d="M7.2 2.2 8 5.1" />
      </g>
      <path
        className="animate-click origin-top-left [transform-box:fill-box]"
        d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"
      />
    </svg>
  )
}
