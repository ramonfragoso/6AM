import type { HauntStatus } from "./hauntOverlayView"
import { useHauntOverlay } from "./useHauntOverlay"

const STATUS_CLASSES: Record<HauntStatus, string> = {
  unseen: "bg-white/15 text-white/70",
  caught: "bg-green-600/80 text-white",
  missed: "bg-red-600/80 text-white",
  refilled: "bg-sky-600/70 text-white",
}

const LEGEND: { status: HauntStatus; label: string }[] = [
  { status: "unseen", label: "unseen" },
  { status: "caught", label: "Caught" },
  { status: "missed", label: "Missed" },
  { status: "refilled", label: "refilled" },
]

export function HauntOverlay() {
  const view = useHauntOverlay()
  if (!view) return null

  return (
    <aside
      aria-label="Haunt overlay"
      className="pointer-events-none fixed top-2 left-2 z-50 max-w-[min(560px,calc(100vw-1rem))] rounded bg-black/70 px-3 py-2 font-mono text-xs leading-5 text-white"
    >
      <p className="font-bold">{view.night}</p>
      <p>{view.loop}</p>
      <p className="pl-8 text-amber-300">{view.passesBy}</p>
      <p>
        <span className="text-white/60">LAST </span>
        {view.last}
      </p>
      <p>
        <span className="text-white/60">ODDS </span>
        {view.odds}
      </p>
      <p>
        <span className="text-white/60">RULES </span>
        {view.rules}
      </p>
      {view.kinds.map((row) => (
        <div key={row.kind} className="mt-1 flex flex-wrap items-center gap-1">
          <span className="w-12 text-white/60">{row.kind}</span>
          {row.cells.map((cell) => (
            <span
              key={cell.id}
              className={`w-6 rounded-sm text-center ${STATUS_CLASSES[cell.status]} ${cell.current ? "outline-2 outline-amber-300" : ""}`}
            >
              {cell.label}
            </span>
          ))}
          <span className="ml-1 text-white/60">refilled {row.refills}</span>
        </div>
      ))}
      <p className="mt-1 flex gap-2 text-white/60">
        {LEGEND.map(({ status, label }) => (
          <span key={status} className={`rounded-sm px-1 ${STATUS_CLASSES[status]}`}>
            {label}
          </span>
        ))}
        <span className="rounded-sm px-1 outline-2 outline-amber-300">current</span>
      </p>
    </aside>
  )
}
