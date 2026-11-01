import { readdir, stat } from "node:fs/promises"
import path from "node:path"
import type { GameAsset } from "./downloads"

const PUBLIC_FOLDER = path.join(process.cwd(), "public")

const FIRST_DOWNLOADED_FOLDER = "basis"

const GAME_ASSET_FOLDERS = [FIRST_DOWNLOADED_FOLDER, "models", "sounds", "textures"]

export async function listGameAssets(): Promise<GameAsset[]> {
  const listed = await Promise.all(GAME_ASSET_FOLDERS.map((folder) => filesIn(folder)))
  return listed.flat().sort(downloadOrder)
}

async function filesIn(folder: string): Promise<GameAsset[]> {
  const entries = await readdir(path.join(PUBLIC_FOLDER, folder), { withFileTypes: true })
  const assets = await Promise.all(
    entries.map(async (entry) => {
      const relative = `${folder}/${entry.name}`
      if (entry.isDirectory()) return filesIn(relative)
      const { size } = await stat(path.join(PUBLIC_FOLDER, relative))
      return [{ url: `/${relative}`, bytes: size }]
    }),
  )
  return assets.flat()
}

function downloadOrder(first: GameAsset, second: GameAsset) {
  const firstEarly = first.url.startsWith(`/${FIRST_DOWNLOADED_FOLDER}/`)
  const secondEarly = second.url.startsWith(`/${FIRST_DOWNLOADED_FOLDER}/`)
  if (firstEarly !== secondEarly) return firstEarly ? -1 : 1
  return second.bytes - first.bytes
}
