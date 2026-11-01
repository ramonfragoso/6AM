import { listGameAssets } from "@/loading/gameAssets"
import { Game } from "@/world/Game"

export default async function HomePage() {
  return <Game assets={await listGameAssets()} />
}
