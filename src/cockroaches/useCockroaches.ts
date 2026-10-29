import { useFrame } from "@react-three/fiber"
import { type RefObject, useEffect, useMemo, useRef } from "react"
import { DynamicDrawUsage, InstancedBufferAttribute, InstancedMesh, Matrix4 } from "three"
import { hauntState } from "@/haunts/hauntState"
import { placedPieces } from "@/kit/placedPieces"
import type { Kit } from "@/kit/useKit"
import { useModel } from "@/models/useModel"
import { nightClock } from "@/night/nightClock"
import { playerPose } from "@/player/playerPose"
import { placedCoatRack } from "@/props/coatRack"
import { useDisposeWhenDropped } from "@/safeRoom/useDisposeWhenDropped"
import { type BakedCockroach, bakeCockroach, COCKROACH_URL } from "./cockroachAnimation"
import { CockroachMaterial, POSE_ATTRIBUTE } from "./cockroachLook"
import {
  type Cockroach,
  type Cockroaches,
  placeCockroach,
  poseOf,
  releaseCockroaches,
  stepSwarm,
} from "./cockroachWalk"
import { houseStrips, type LiveObstacles, withLiveObstacles } from "./houseStrips"
import type { Strip } from "./surfaceMap"
import { MAX_COCKROACHES, useCockroachTuning } from "./useCockroachTuning"
import { useCockroachSounds } from "./useCockroachSounds"

export type Swarm = { cockroaches: Cockroaches; roaches: Cockroach[]; count: number }

type SwarmMesh = InstancedMesh<BakedCockroach["geometry"], CockroachMaterial>

type SeenObstacles = { strips: Strip[]; live: LiveObstacles }

const MAX_FRAME_SECONDS = 0.1

const POSE_SIZE = 3

const ALWAYS_DRAWN = 1

const HIDDEN = new Matrix4().makeScale(0, 0, 0)

const matrix = new Matrix4()

export function useCockroaches(kit: Kit) {
  const { walk, look, sound } = useCockroachTuning()
  const { scene, animations } = useModel(COCKROACH_URL)
  const baked = useMemo(() => bakeCockroach(scene, animations), [scene, animations])
  useDisposeWhenDropped(baked, disposeBaked)
  const mesh = useMemo(() => swarmMesh(baked), [baked])
  useDisposeWhenDropped(mesh, disposeSwarmMesh)
  const strips = useMemo(() => houseStrips(kit), [kit])
  const swarm = useRef<Swarm | null>(null)
  const obstacles = useRef<SeenObstacles | null>(null)
  useCockroachSounds(swarm, sound)

  useEffect(() => {
    mesh.material.color.set(look.color)
    mesh.material.roughness = look.roughness
  }, [mesh, look])

  useFrame((_, delta) => {
    refreshObstacles(obstacles, kit, strips)
    const released = hauntState.cockroaches
    if (!released) {
      if (swarm.current) hide(mesh)
      swarm.current = null
      return
    }
    if (swarm.current?.cockroaches !== released) {
      swarm.current = {
        cockroaches: released,
        roaches: releaseCockroaches(released, strips, MAX_COCKROACHES),
        count: 0,
      }
    }
    const current = swarm.current
    current.count = Math.min(walk.count, MAX_COCKROACHES)
    stepSwarm(
      current.roaches,
      current.count,
      {
        strips,
        settings: walk,
        sinceRelease: nightClock() - released.releasedAt,
        eye: playerPose.eye,
        idleSeconds: baked.idle.seconds,
      },
      Math.min(delta, MAX_FRAME_SECONDS),
    )
    const poses = mesh.geometry.getAttribute(POSE_ATTRIBUTE) as InstancedBufferAttribute
    for (let index = 0; index < current.count; index++) {
      const roach = current.roaches[index]
      mesh.setMatrixAt(index, placeCockroach(roach, strips, walk, matrix))
      poses.set(poseOf(roach), index * POSE_SIZE)
    }
    if (current.count === 0) mesh.setMatrixAt(0, HIDDEN)
    mesh.count = Math.max(current.count, ALWAYS_DRAWN)
    mesh.instanceMatrix.needsUpdate = true
    poses.needsUpdate = true
  })

  return mesh
}

function refreshObstacles(seen: RefObject<SeenObstacles | null>, kit: Kit, strips: Strip[]) {
  const live = { ...placedPieces, coatRack: { ...placedCoatRack } }
  if (seen.current?.strips === strips && sameObstacles(seen.current.live, live)) return
  seen.current = { strips, live }
  withLiveObstacles(strips, kit, live)
}

function sameObstacles(seen: LiveObstacles, live: LiveObstacles) {
  return (
    seen.paintings === live.paintings &&
    seen.furniture === live.furniture &&
    seen.candleSets === live.candleSets &&
    seen.coatRack.x === live.coatRack.x &&
    seen.coatRack.z === live.coatRack.z &&
    seen.coatRack.size === live.coatRack.size
  )
}

function swarmMesh(baked: BakedCockroach): SwarmMesh {
  const geometry = baked.geometry.clone()
  const poses = new InstancedBufferAttribute(
    new Float32Array(MAX_COCKROACHES * POSE_SIZE),
    POSE_SIZE,
  )
  poses.setUsage(DynamicDrawUsage)
  geometry.setAttribute(POSE_ATTRIBUTE, poses)
  const mesh = new InstancedMesh(geometry, new CockroachMaterial(baked), MAX_COCKROACHES)
  mesh.instanceMatrix.setUsage(DynamicDrawUsage)
  mesh.frustumCulled = false
  mesh.castShadow = false
  mesh.receiveShadow = true
  hide(mesh)
  return mesh
}

function hide(mesh: SwarmMesh) {
  mesh.setMatrixAt(0, HIDDEN)
  mesh.count = ALWAYS_DRAWN
  mesh.instanceMatrix.needsUpdate = true
}

function disposeBaked({ geometry, poses }: BakedCockroach) {
  geometry.dispose()
  poses.dispose()
}

function disposeSwarmMesh(mesh: SwarmMesh) {
  mesh.geometry.dispose()
  mesh.material.dispose()
  mesh.dispose()
}
