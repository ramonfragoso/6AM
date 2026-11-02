import { useText } from "@/i18n/text"
import type { GameAsset } from "./downloads"
import { METER_FADE_SECONDS, SCREEN_FADE_SECONDS, useLoadingScreen } from "./useLoadingScreen"

export function LoadingScreen({ assets }: { assets: readonly GameAsset[] }) {
  const { screen, meter, percent, fill } = useLoadingScreen(assets)
  const { text } = useText()

  return (
    <div
      ref={screen}
      role="progressbar"
      aria-label={text.loading}
      className="fixed inset-0 z-[60] bg-black text-white transition-opacity ease-in-out"
      style={{ transitionDuration: `${SCREEN_FADE_SECONDS}s` }}
    >
      <div
        ref={meter}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 transition-opacity ease-in-out"
        style={{ transitionDuration: `${METER_FADE_SECONDS}s` }}
      >
        <p ref={percent} className="text-sm tracking-[0.2em] tabular-nums">
          0%
        </p>
        <div className="h-px w-[min(18rem,60vw)] bg-neutral-700">
          <div ref={fill} className="h-full origin-left scale-x-0 bg-white" />
        </div>
      </div>
    </div>
  )
}
