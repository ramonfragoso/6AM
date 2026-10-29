import { Box3, BufferAttribute, BufferGeometry, Sphere, Vector3 } from "three"

const ROUNDS = 8

type Cluster = { center: Vector3; triangles: number[] }

export function splitInTwo(geometry: BufferGeometry): [BufferGeometry, BufferGeometry] {
  const centroids = triangleCentroids(geometry)
  const [a, b] = farthestPair(centroids)
  const clusters: [Cluster, Cluster] = [
    { center: a.clone(), triangles: [] },
    { center: b.clone(), triangles: [] },
  ]
  for (let round = 0; round < ROUNDS; round++) {
    clusters.forEach((cluster) => (cluster.triangles = []))
    centroids.forEach((centroid, triangle) => {
      const nearer =
        centroid.distanceTo(clusters[0].center) <= centroid.distanceTo(clusters[1].center)
      clusters[nearer ? 0 : 1].triangles.push(triangle)
    })
    clusters.forEach((cluster) => meanOf(cluster, centroids))
  }
  return [subset(geometry, clusters[0].triangles), subset(geometry, clusters[1].triangles)]
}

export function indexedBounds(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position")
  const index = geometry.getIndex()
  const bounds = new Box3()
  const point = new Vector3()
  const count = index ? index.count : position.count
  for (let corner = 0; corner < count; corner++) {
    bounds.expandByPoint(point.fromBufferAttribute(position, index ? index.getX(corner) : corner))
  }
  return bounds
}

function triangleCentroids(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position")
  const index = geometry.getIndex()
  if (!index) throw new Error("splitInTwo needs an indexed geometry")
  const corner = new Vector3()
  return Array.from({ length: index.count / 3 }, (_, triangle) => {
    const centroid = new Vector3()
    for (let side = 0; side < 3; side++) {
      centroid.add(corner.fromBufferAttribute(position, index.getX(triangle * 3 + side)))
    }
    return centroid.divideScalar(3)
  })
}

function farthestPair(points: Vector3[]): [Vector3, Vector3] {
  const from = points.reduce((far, point) =>
    point.distanceToSquared(points[0]) > far.distanceToSquared(points[0]) ? point : far,
  )
  const to = points.reduce((far, point) =>
    point.distanceToSquared(from) > far.distanceToSquared(from) ? point : far,
  )
  return [from, to]
}

function meanOf(cluster: Cluster, centroids: Vector3[]) {
  if (cluster.triangles.length === 0) return
  cluster.center.set(0, 0, 0)
  for (const triangle of cluster.triangles) cluster.center.add(centroids[triangle])
  cluster.center.divideScalar(cluster.triangles.length)
}

function subset(geometry: BufferGeometry, triangles: number[]) {
  const index = geometry.getIndex()!
  const part = new BufferGeometry()
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    part.setAttribute(name, attribute)
  }
  const corners = new Uint32Array(triangles.length * 3)
  triangles.forEach((triangle, at) => {
    for (let side = 0; side < 3; side++) corners[at * 3 + side] = index.getX(triangle * 3 + side)
  })
  part.setIndex(new BufferAttribute(corners, 1))
  part.boundingBox = indexedBounds(part)
  part.boundingSphere = part.boundingBox.getBoundingSphere(new Sphere())
  return part
}
