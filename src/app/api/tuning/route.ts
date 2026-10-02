import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const TUNING_FILE = path.join(process.cwd(), "public", "tuning.json")

const JSON_INDENT = 2

const MISSING_FILE = "ENOENT"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const saved = await readFile(TUNING_FILE, "utf8")
    return new Response(saved, { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    if (isMissingFile(error)) return Response.json({})
    throw error
  }
}

export async function PUT(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Saving Tuning only works under npm run dev", { status: 403 })
  }

  const tuning: unknown = await request.json()
  if (!isPlainObject(tuning)) {
    return new Response("Tuning must be a JSON object", { status: 400 })
  }

  await writeFile(TUNING_FILE, `${JSON.stringify(sortedByPath(tuning), null, JSON_INDENT)}\n`)
  return new Response(null, { status: 204 })
}

function isMissingFile(error: unknown) {
  return error instanceof Error && "code" in error && error.code === MISSING_FILE
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function sortedByPath(tuning: Record<string, unknown>) {
  const entries = Object.entries(tuning).sort(([first], [second]) => first.localeCompare(second))
  return Object.fromEntries(entries)
}
