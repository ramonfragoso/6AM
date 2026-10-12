import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS, EXTMeshoptCompression, KHRTextureBasisu } from "@gltf-transform/extensions"
import { dedup, join as joinPrimitives, prune, quantize, reorder } from "@gltf-transform/functions"
import { MeshoptEncoder } from "meshoptimizer"
import sharp from "sharp"

const UASTC_ENCODING = [
  "--encode",
  "uastc",
  "--uastc-quality",
  "2",
  "--uastc-rdo",
  "--uastc-rdo-l",
  "1",
  "--zstd",
  "18",
]

const ETC1S_ENCODING = ["--encode", "basis-lz", "--qlevel", "255", "--clevel", "4"]

const PAINTING_ENCODING = ["--format", "R8G8B8_SRGB", "--assign-tf", "srgb", ...UASTC_ENCODING]

const PAINTING_DIRECTORY = "paintings"

const ANCHOR_MARKER = "__anchor_"

const KEEP_ANCHOR_NODES = true

const TEXCOORD_BITS = 14

const EXTENSION_BY_MIME = { "image/png": "png", "image/jpeg": "jpg" }

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")

const CACHE_DIRECTORY = join(PROJECT_ROOT, "node_modules", ".cache", "compress-model")

const PROGRESS_TAG = "COMPRESS_PROGRESS"

const [inputPath, outputPath] = process.argv.slice(2)

if (!inputPath || !outputPath) {
  console.error("Usage: node tools/kit/compress-model.mjs <input.glb> <output.glb>")
  process.exit(1)
}

await MeshoptEncoder.ready

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder })

const document = await io.read(inputPath)
markAnchors(document)
await document.transform(
  dedup(),
  joinPrimitives({ cleanup: false }),
  prune({ keepExtras: KEEP_ANCHOR_NODES }),
)

const paintings = paintingsOf(inputPath)
const paintingDirectory = join(dirname(outputPath), PAINTING_DIRECTORY)
const workDirectory = mkdtempSync(join(tmpdir(), "compress-model-"))
mkdirSync(CACHE_DIRECTORY, { recursive: true })
try {
  const textures = document.getRoot().listTextures()
  const total = textures.length + paintings.length
  textures.forEach((texture, index) => {
    console.log(`${PROGRESS_TAG} ${index}/${total} ${texture.getName()}`)
    compressTexture(texture, index)
  })
  mkdirSync(paintingDirectory, { recursive: true })
  for (const [index, painting] of paintings.entries()) {
    console.log(`${PROGRESS_TAG} ${textures.length + index}/${total} ${painting.name}`)
    await compressPainting(painting)
  }
} finally {
  rmSync(workDirectory, { recursive: true, force: true })
}

document.createExtension(KHRTextureBasisu).setRequired(true)
await document.transform(
  reorder({ encoder: MeshoptEncoder }),
  quantize({ quantizeTexcoord: TEXCOORD_BITS }),
)
document
  .createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER })

const partialPath = `${outputPath}.partial`
writeFileSync(partialPath, await io.writeBinary(document))
renameSync(partialPath, outputPath)
console.log(`${inputPath} → ${outputPath}`)

function markAnchors(document) {
  for (const node of document.getRoot().listNodes()) {
    if (node.getName().includes(ANCHOR_MARKER)) node.setExtras({ anchor: true })
  }
}

function compressTexture(texture, index) {
  const extension = EXTENSION_BY_MIME[texture.getMimeType()]
  if (!extension) return
  const encoding = [...encodingFor(texture), "--generate-mipmap"]
  const cached = join(CACHE_DIRECTORY, `${cacheKey(texture.getImage(), encoding)}.ktx2`)
  if (!existsSync(cached)) {
    const source = join(workDirectory, `${index}.${extension}`)
    const target = join(workDirectory, `${index}.ktx2`)
    writeFileSync(source, texture.getImage())
    execFileSync("ktx", ["create", ...encoding, source, target])
    copyFileSync(target, cached)
  }
  texture.setImage(new Uint8Array(readFileSync(cached))).setMimeType("image/ktx2")
}

function paintingsOf(glbPath) {
  const summaryPath = glbPath.replace(/\.glb$/, ".summary.json")
  if (!existsSync(summaryPath)) return []
  const { paintings = {} } = JSON.parse(readFileSync(summaryPath, "utf8"))
  return Object.entries(paintings).map(([name, painting]) => ({ name, ...painting }))
}

async function compressPainting({ name, path, width, height }) {
  const encoding = [...PAINTING_ENCODING, "--generate-mipmap"]
  const image = readFileSync(path)
  const cached = join(CACHE_DIRECTORY, `${cacheKey(image, [...encoding, width, height])}.ktx2`)
  if (!existsSync(cached)) {
    const resized = join(workDirectory, `${name}.png`)
    const target = join(workDirectory, `${name}.ktx2`)
    await sharp(image)
      .resize(width, height, { fit: "fill", kernel: "lanczos3" })
      .png()
      .toFile(resized)
    execFileSync("ktx", ["create", ...encoding, resized, target])
    copyFileSync(target, cached)
  }
  const output = join(paintingDirectory, `${name}.ktx2`)
  copyFileSync(cached, `${output}.partial`)
  renameSync(`${output}.partial`, output)
}

function cacheKey(image, encoding) {
  return createHash("sha256").update(image).update(JSON.stringify(encoding)).digest("hex")
}

function encodingFor(texture) {
  const role = roleOf(texture)
  if (role === "normal") {
    return ["--format", "R8G8B8_UNORM", "--assign-tf", "linear", ...UASTC_ENCODING]
  }
  if (role === "color") {
    const format = hasAlpha(texture) ? "R8G8B8A8_SRGB" : "R8G8B8_SRGB"
    return ["--format", format, ...ETC1S_ENCODING]
  }
  return ["--format", "R8G8B8_UNORM", "--assign-tf", "linear", ...ETC1S_ENCODING]
}

function roleOf(texture) {
  const materials = document.getRoot().listMaterials()
  if (materials.some((material) => material.getNormalTexture() === texture)) return "normal"
  const isColor = materials.some(
    (material) =>
      material.getBaseColorTexture() === texture || material.getEmissiveTexture() === texture,
  )
  return isColor ? "color" : "data"
}

function hasAlpha(texture) {
  return document
    .getRoot()
    .listMaterials()
    .some(
      (material) =>
        material.getBaseColorTexture() === texture && material.getAlphaMode() !== "OPAQUE",
    )
}
