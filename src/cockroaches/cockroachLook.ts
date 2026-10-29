import type { DataTexture } from "three"
import {
  attribute,
  floor,
  fract,
  int,
  ivec2,
  mix,
  mod,
  normalLocal,
  positionLocal,
  textureLoad,
  vertexIndex,
} from "three/tsl"
import { MeshStandardNodeMaterial, type Node, type NodeBuilder } from "three/webgpu"
import type { BakedClip, BakedCockroach } from "./cockroachAnimation"

export const POSE_ATTRIBUTE = "cockroachPose"

const POSITION_ROWS = 0

export class CockroachMaterial extends MeshStandardNodeMaterial {
  private readonly baked: BakedCockroach

  constructor(baked: BakedCockroach) {
    super({ map: baked.map, name: "cockroach" })
    this.baked = baked
  }

  setupPosition(builder: NodeBuilder) {
    const { position, normal } = bakedPose(this.baked)
    positionLocal.assign(position)
    normalLocal.assign(normal)
    return super.setupPosition(builder)
  }
}

function bakedPose({ poses, walk, idle, normalRows }: BakedCockroach) {
  const pose = attribute(POSE_ATTRIBUTE, "vec3")
  const column = int(vertexIndex).toVar()
  const walking = sampledClip(poses, column, walk, pose.x, normalRows)
  const idling = sampledClip(poses, column, idle, pose.y, normalRows)
  return {
    position: mix(idling.position, walking.position, pose.z),
    normal: mix(idling.normal, walking.normal, pose.z).normalize(),
  }
}

function sampledClip(
  poses: DataTexture,
  column: Node<"int">,
  clip: BakedClip,
  phase: Node<"float">,
  normalRows: number,
) {
  const at = fract(phase).mul(clip.frames).toVar()
  const frame = floor(at).toVar()
  const share = at.sub(frame).toVar()
  const row = int(frame).add(clip.firstRow).toVar()
  const nextRow = int(mod(frame.add(1), clip.frames))
    .add(clip.firstRow)
    .toVar()
  const sampleAt = (skippedRows: number) =>
    mix(
      textureLoad(poses, ivec2(column, row.add(skippedRows))).xyz,
      textureLoad(poses, ivec2(column, nextRow.add(skippedRows))).xyz,
      share,
    )
  return { position: sampleAt(POSITION_ROWS), normal: sampleAt(normalRows) }
}
