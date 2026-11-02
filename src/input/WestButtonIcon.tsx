import { FaceButtonIcon } from "./FaceButtonIcon"

const XBOX_X_BLUE = "#3d8af7"

const PLAYSTATION_SQUARE_PINK = "#e58fc6"

export function WestButtonIcon() {
  return (
    <span className="hidden size-8 place-items-center group-data-[device=playstation]:grid group-data-[device=xbox]:grid">
      <FaceButtonIcon device="xbox">
        <path d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5" stroke={XBOX_X_BLUE} strokeWidth="2.4" />
      </FaceButtonIcon>
      <FaceButtonIcon device="playstation">
        <rect
          x="8.25"
          y="8.25"
          width="7.5"
          height="7.5"
          fill="none"
          stroke={PLAYSTATION_SQUARE_PINK}
          strokeWidth="1.8"
        />
      </FaceButtonIcon>
    </span>
  )
}
