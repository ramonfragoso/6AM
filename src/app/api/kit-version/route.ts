import { stat } from "node:fs/promises"
import path from "node:path"

const KIT_FILE = path.join(process.cwd(), "public", "models", "kit.glb")

export const dynamic = "force-dynamic"

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Kit reloading only works under npm run dev", { status: 404 })
  }

  const { mtimeMs } = await stat(KIT_FILE)
  return Response.json({ version: Math.round(mtimeMs) })
}
