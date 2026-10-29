import { useVoidScreen } from "./useVoidScreen"

export function VoidScreen() {
  const { covered, seconds } = useVoidScreen()

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[44] bg-black transition-opacity ease-linear"
      style={{ opacity: covered ? 1 : 0, transitionDuration: `${seconds}s` }}
    />
  )
}
