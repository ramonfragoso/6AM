import { FaceButtonIcon } from "./FaceButtonIcon"

const XBOX_A_GREEN = "#5dc21e"

const PLAYSTATION_CROSS_BLUE = "#7c9fe6"

export function SouthButtonIcon() {
  return (
    <span className="hidden size-8 place-items-center [filter:drop-shadow(0_0_6px_rgb(0_0_0/0.9))] group-data-[device=playstation]:grid group-data-[device=xbox]:grid">
      <FaceButtonIcon device="xbox">
        <text
          x="12"
          y="16.2"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="12"
          fontWeight="bold"
          letterSpacing="0"
          fill={XBOX_A_GREEN}
        >
          A
        </text>
      </FaceButtonIcon>
      <FaceButtonIcon device="playstation">
        <path
          d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5"
          stroke={PLAYSTATION_CROSS_BLUE}
          strokeWidth="1.8"
        />
      </FaceButtonIcon>
    </span>
  )
}
