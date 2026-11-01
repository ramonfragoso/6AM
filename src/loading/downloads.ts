import { Cache } from "three"

export type GameAsset = { url: string; bytes: number }

type Download = {
  asset: GameAsset
  counted: number
  parsed: boolean
  body: Promise<ArrayBuffer | null>
}

const THREE_FILE_KEY = "file:"

const TEXT_FILE = ".js"

const PARSED_FILES = [".glb", ".ktx2"]

const downloads = new Map<string, Download>()

const totals = {
  started: false,
  expected: 0,
  received: 0,
  unfinished: 0,
  toParse: 0,
  parsed: 0,
}

export function downloadGameAssets(assets: readonly GameAsset[]) {
  if (totals.started) return
  totals.started = true
  Cache.enabled = true
  for (const asset of assets) {
    totals.expected += asset.bytes
    totals.unfinished += 1
    if (isParsed(asset)) totals.toParse += asset.bytes
    const download: Download = {
      asset,
      counted: 0,
      parsed: false,
      body: Promise.resolve(null),
    }
    download.body = fetchCounted(download)
    downloads.set(asset.url, download)
  }
}

export function downloadedBody(url: string) {
  return downloads.get(url)?.body ?? null
}

export function downloadedShare() {
  return totals.expected > 0 ? totals.received / totals.expected : 0
}

export function markParsed(url: string) {
  const download = downloads.get(url)
  if (!download || download.parsed || !isParsed(download.asset)) return
  download.parsed = true
  totals.parsed += download.asset.bytes
}

export function parsedShare() {
  return totals.toParse > 0 ? totals.parsed / totals.toParse : 0
}

export function downloadsFinished() {
  return totals.started && totals.unfinished === 0
}

export function releaseDownloads() {
  downloads.clear()
  Cache.clear()
  Cache.enabled = false
}

function isParsed(asset: GameAsset) {
  return PARSED_FILES.some((extension) => asset.url.endsWith(extension))
}

async function fetchCounted(download: Download) {
  try {
    const response = await fetch(download.asset.url)
    if (!response.ok || !response.body) throw new Error(`${response.status}`)
    const body = await readCounted(response.body, download)
    shareWithThree(download.asset.url, body)
    return body
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`${download.asset.url} did not download: ${error}`)
    return null
  } finally {
    count(download, download.asset.bytes - download.counted)
    totals.unfinished -= 1
  }
}

async function readCounted(stream: ReadableStream<Uint8Array>, download: Download) {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    length += value.length
    count(download, Math.min(value.length, download.asset.bytes - download.counted))
  }
  const joined = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.length
  }
  return joined.buffer
}

function count(download: Download, bytes: number) {
  download.counted += bytes
  totals.received += bytes
}

function shareWithThree(url: string, body: ArrayBuffer) {
  const data = url.endsWith(TEXT_FILE) ? new TextDecoder().decode(body) : body
  Cache.add(`${THREE_FILE_KEY}${url}`, data)
}
