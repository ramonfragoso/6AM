import {
  type AnimationClip,
  AnimationMixer,
  Box3,
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  FloatType,
  NearestFilter,
  type Object3D,
  RGBAFormat,
  type SkinnedMesh,
  type Texture,
  Vector3,
} from "three"
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js"

export type BakedClip = { firstRow: number; frames: number; seconds: number }

export type BakedCockroach = {
  geometry: BufferGeometry
  poses: DataTexture
  normalRows: number
  walk: BakedClip
  idle: BakedClip
  map: Texture | null
}

export const COCKROACH_URL = "/models/giant_cockroach.glb"

const WALK_CLIP = "|walking"

const IDLE_CLIP = "|idle"

const BODY_BONE = "body_02_01"

const HEAD_BONE = "head_04"

const BAKE_RATE = 30

const CHANNELS = 4

const XYZ = 3

const DEPTH_AXIS = 2

export function bakeCockroach(scene: Object3D, clips: AnimationClip[]): BakedCockroach {
  const model = clone(scene)
  const mesh = skinnedMeshOf(model)
  const mixer = new AnimationMixer(model)
  const walkClip = clipEnding(clips, WALK_CLIP)
  const idleClip = clipEnding(clips, IDLE_CLIP)
  const walk = bakedClip(walkClip, 0)
  const idle = bakedClip(idleClip, walk.frames)
  const rows = walk.frames + idle.frames
  const vertices = mesh.geometry.attributes.position.count
  const data = new Float32Array(vertices * rows * 2 * CHANNELS)
  const index = mesh.geometry.index
  if (!index) throw new Error(`${COCKROACH_URL} has no index; export it again`)

  posed(mixer, model, idleClip, 0)
  const rest = skinnedPositions(mesh)
  const fit = fitOf(model, rest)

  for (const [clip, baked] of [
    [walkClip, walk],
    [idleClip, idle],
  ] as const) {
    for (let frame = 0; frame < baked.frames; frame++) {
      posed(mixer, model, clip, (frame / baked.frames) * clip.duration)
      const positions = fitted(skinnedPositions(mesh), fit)
      const normals = vertexNormals(positions, index.array)
      writeRow(data, vertices, baked.firstRow + frame, positions)
      writeRow(data, vertices, rows + baked.firstRow + frame, normals)
    }
  }

  const poses = new DataTexture(data, vertices, rows * 2, RGBAFormat, FloatType)
  poses.minFilter = NearestFilter
  poses.magFilter = NearestFilter
  poses.generateMipmaps = false
  poses.needsUpdate = true

  const restPositions = fitted(rest, fit)
  const geometry = new BufferGeometry()
  geometry.setIndex(index.clone())
  geometry.setAttribute("position", new BufferAttribute(restPositions, XYZ))
  geometry.setAttribute(
    "normal",
    new BufferAttribute(vertexNormals(restPositions, index.array), XYZ),
  )
  geometry.setAttribute("uv", mesh.geometry.attributes.uv.clone())

  const material = mesh.material as { map?: Texture | null }
  return {
    geometry,
    poses,
    normalRows: rows,
    walk,
    idle,
    map: material.map ?? null,
  }
}

function skinnedMeshOf(model: Object3D) {
  let found: SkinnedMesh | null = null
  model.traverse((object) => {
    if ((object as SkinnedMesh).isSkinnedMesh) found = object as SkinnedMesh
  })
  if (!found) throw new Error(`${COCKROACH_URL} has no skinned mesh; export it again`)
  return found as SkinnedMesh
}

function clipEnding(clips: AnimationClip[], ending: string) {
  const clip = clips.find((candidate) => candidate.name.endsWith(ending))
  if (!clip) throw new Error(`${COCKROACH_URL} has no "${ending}" clip; export it again`)
  return clip
}

function bakedClip(clip: AnimationClip, firstRow: number): BakedClip {
  return {
    firstRow,
    frames: Math.max(Math.round(clip.duration * BAKE_RATE), 1),
    seconds: clip.duration,
  }
}

function posed(mixer: AnimationMixer, model: Object3D, clip: AnimationClip, seconds: number) {
  mixer.stopAllAction()
  mixer.clipAction(clip).reset().play()
  mixer.setTime(seconds)
  model.updateMatrixWorld(true)
}

function skinnedPositions(mesh: SkinnedMesh) {
  const { position } = mesh.geometry.attributes
  const result = new Float32Array(position.count * XYZ)
  const vertex = new Vector3()
  for (let index = 0; index < position.count; index++) {
    vertex.fromBufferAttribute(position, index)
    mesh.applyBoneTransform(index, vertex).applyMatrix4(mesh.matrixWorld)
    vertex.toArray(result, index * XYZ)
  }
  return result
}

type Fit = { pivot: Vector3; floor: number; length: number }

function fitOf(model: Object3D, rest: Float32Array): Fit {
  const bounds = new Box3().setFromArray(rest)
  const body = boneAt(model, BODY_BONE)
  const head = boneAt(model, HEAD_BONE)
  const pivot = body.add(head).multiplyScalar(1 / 2)
  const size = bounds.getSize(new Vector3())
  return { pivot, floor: bounds.min.y, length: size.getComponent(DEPTH_AXIS) }
}

function boneAt(model: Object3D, name: string) {
  const bone = model.getObjectByName(name)
  if (!bone) throw new Error(`${COCKROACH_URL} has no "${name}" bone; export it again`)
  return bone.getWorldPosition(new Vector3())
}

function fitted(positions: Float32Array, { pivot, floor, length }: Fit) {
  const result = new Float32Array(positions.length)
  for (let index = 0; index < positions.length; index += XYZ) {
    result[index] = -(positions[index] - pivot.x) / length
    result[index + 1] = (positions[index + 1] - floor) / length
    result[index + 2] = -(positions[index + 2] - pivot.z) / length
  }
  return result
}

function vertexNormals(positions: Float32Array, index: ArrayLike<number>) {
  const geometry = new BufferGeometry()
  geometry.setIndex(Array.from(index))
  geometry.setAttribute("position", new BufferAttribute(positions, XYZ))
  geometry.computeVertexNormals()
  const normals = geometry.attributes.normal.array as Float32Array
  geometry.dispose()
  return normals
}

function writeRow(data: Float32Array, vertices: number, row: number, values: Float32Array) {
  for (let vertex = 0; vertex < vertices; vertex++) {
    const at = (row * vertices + vertex) * CHANNELS
    data[at] = values[vertex * XYZ]
    data[at + 1] = values[vertex * XYZ + 1]
    data[at + 2] = values[vertex * XYZ + 2]
    data[at + 3] = 1
  }
}
