import type { Ref } from "react"
import { ZoomButtonIcon } from "./ZoomButtonIcon"
import { ZOOM_FILL_PROPERTY } from "./useZoomTutorial"

const ZOOM_TEXT = "ZooM"

const FILL = `var(${ZOOM_FILL_PROPERTY}, 0)`

const UNFILLED_SHARE = `calc(1 - ${FILL})`

const SHOWN_ONCE_FILLING = `calc(${FILL} * 1000)`

const SHOWN_ONCE_FULL = `calc((${FILL} - 0.999) * 1000)`

type ZoomTutorialProps = { ref: Ref<HTMLDivElement> }

export function ZoomTutorial({ ref }: ZoomTutorialProps) {
  return (
    <div
      ref={ref}
      data-device="mouse"
      className="group pointer-events-none fixed top-[68%] left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-3 text-white/80 opacity-0 select-none"
    >
      <div className="flex items-center gap-3">
        <p className="text-2xl tracking-[0.2em] whitespace-nowrap [text-shadow:0_0_10px_rgb(0_0_0/0.9),0_0_2px_rgb(0_0_0)]">
          {ZOOM_TEXT}
        </p>
        <ZoomButtonIcon />
      </div>
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-5 [filter:drop-shadow(0_0_4px_rgb(0_0_0/0.9))]"
      >
        <circle
          cx="12"
          cy="12"
          r="4.6"
          fill="none"
          stroke="white"
          strokeWidth="9.2"
          pathLength="1"
          strokeDasharray="1 1"
          transform="rotate(-90 12 12)"
          style={{ strokeDashoffset: UNFILLED_SHARE, opacity: SHOWN_ONCE_FILLING }}
        />
        <circle cx="12" cy="12" r="9.2" fill="white" style={{ opacity: SHOWN_ONCE_FULL }} />
        <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="1.6" />
      </svg>
    </div>
  )
}
