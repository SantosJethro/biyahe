import { z } from 'zod'

/**
 * Shared toll domain model — imported by BOTH the React client (`src/`) and the
 * serverless functions (`api/`). Keeping it in one place means the pricing rule,
 * the network topology and the data schema can never drift between front-end and
 * back-end.
 *
 * Pricing model
 * -------------
 * Philippine expressways price by an entry/exit matrix that closely tracks
 * distance travelled. We model each interchange with a *cumulative* Class-1 toll
 * measured from the expressway's reference origin. The Class-1 fare between two
 * interchanges is the absolute difference of their cumulative values; higher
 * vehicle classes multiply that fare by a per-expressway factor.
 *
 * Routing model
 * -------------
 * Every interchange carries a lat/lng. A trip is expressed as an ORIGIN and a
 * DESTINATION place; `planRoute` snaps each to its nearest interchange and finds
 * the cheapest toll path across the network, hopping between expressways at the
 * junctions listed in {@link CONNECTIONS}. This is what powers "Baguio → Clark".
 */

export type VehicleClassId = 1 | 2 | 3

export interface LatLng {
  lat: number
  lng: number
}

export const vehicleClassRateSchema = z.object({
  classId: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  label: z.string().min(1),
  multiplier: z.number().positive(),
})
export type VehicleClassRate = z.infer<typeof vehicleClassRateSchema>

export const interchangeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Kilometre post, used only for display / ordering. */
  km: z.number().nonnegative(),
  /** Cumulative Class-1 toll (in PHP) from the expressway's reference origin. */
  class1Toll: z.number().nonnegative(),
  lat: z.number(),
  lng: z.number(),
})
export type Interchange = z.infer<typeof interchangeSchema>

/** Electronic toll-collection tag an expressway accepts. */
export const RFID_SYSTEMS = ['Easytrip', 'Autosweep'] as const
export const rfidSystemSchema = z.enum(RFID_SYSTEMS)
export type RfidSystem = z.infer<typeof rfidSystemSchema>

export const expresswaySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  operator: z.string().min(1),
  region: z.string().min(1),
  system: z.enum(['expressway', 'skyway']),
  /** RFID sticker required to pass this expressway's toll plazas. */
  rfid: rfidSystemSchema,
  sourceUrl: z.string().url(),
  vehicleClasses: z.array(vehicleClassRateSchema).min(1),
  interchanges: z.array(interchangeSchema).min(2),
  updatedAt: z.string().datetime(),
  source: z.enum(['seed', 'crawl']),
})
export type Expressway = z.infer<typeof expresswaySchema>

export const tollDatasetSchema = z.object({
  generatedAt: z.string().datetime(),
  expressways: z.array(expresswaySchema),
})
export type TollDataset = z.infer<typeof tollDatasetSchema>

/**
 * Physical junctions where you can transfer between two expressways. Each entry
 * references one interchange on each expressway; the toll of each expressway is
 * still charged in full via its own segments, so the transfer itself is free.
 */
export interface Connection {
  a: { expresswayId: string; interchangeId: string }
  b: { expresswayId: string; interchangeId: string }
}

const link = (
  expresswayA: string,
  interchangeA: string,
  expresswayB: string,
  interchangeB: string,
): Connection => {
  return {
    a: { expresswayId: expresswayA, interchangeId: interchangeA },
    b: { expresswayId: expresswayB, interchangeId: interchangeB },
  }
}

export const CONNECTIONS: Connection[] = [
  // Skyway Stage 3 bridges NLEX (Balintawak) and SLEX (its south end feeds
  // Magallanes) across Metro Manila.
  link('nlex', 'balintawak', 'skyway', 'balintawak'),
  link('slex', 'magallanes', 'skyway', 'buendia'),
  // NLEX ties into SCTEX around Clark/Mabalacat; SCTEX ties into TPLEX at Tarlac.
  link('nlex', 'sta-ines', 'sctex', 'clark-north'),
  link('sctex', 'tarlac', 'tplex', 'la-paz'),
  // CALAX's Laguna end meets SLEX near Sta. Rosa/Mamplasan; STAR meets SLEX at
  // Calamba.
  link('calax', 'greenfield', 'slex', 'sta-rosa'),
  link('star', 'calamba', 'slex', 'calamba'),
]

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

/**
 * Fare for travelling one expressway from `fromId` to `toId` for `classId`.
 * Returns `null` when any referenced id is unknown; never throws.
 */
export const segmentCost = (
  expressway: Expressway,
  fromId: string,
  toId: string,
  classId: VehicleClassId,
): number | null => {
  const from = expressway.interchanges.find((i) => i.id === fromId)
  const to = expressway.interchanges.find((i) => i.id === toId)
  const rate = expressway.vehicleClasses.find((v) => v.classId === classId)
  if (!from || !to || !rate) return null
  const class1Fare = Math.abs(from.class1Toll - to.class1Toll)
  return Math.round(class1Fare * rate.multiplier)
}

/** Format a PHP amount for display, e.g. `formatPhp(231)` -> `"₱231"`. */
export const formatPhp = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH')}`
}

// ---------------------------------------------------------------------------
// Geo helpers
// ---------------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371

/** Great-circle distance between two points, in kilometres. */
export const haversineKm = (a: LatLng, b: LatLng): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export interface SnappedPoint {
  expresswayId: string
  expresswayShortName: string
  interchangeId: string
  interchangeName: string
  /** Straight-line distance from the searched place to this interchange (km). */
  distanceKm: number
}

export interface RouteLeg {
  expresswayId: string
  expresswayName: string
  fromId: string
  fromName: string
  toId: string
  toName: string
  cost: number
}

export interface RouteResult {
  ok: boolean
  message?: string
  entry?: SnappedPoint
  exit?: SnappedPoint
  legs: RouteLeg[]
  total: number
}

interface GraphNode {
  key: string
  expressway: Expressway
  interchange: Interchange
}

const nodeKey = (expresswayId: string, interchangeId: string) =>
  `${expresswayId}::${interchangeId}`

const nearestInterchange = (
  expressways: Expressway[],
  point: LatLng,
): (SnappedPoint & { key: string }) | null => {
  let best: (SnappedPoint & { key: string }) | null = null
  for (const x of expressways) {
    for (const ic of x.interchanges) {
      const distanceKm = haversineKm(point, { lat: ic.lat, lng: ic.lng })
      if (!best || distanceKm < best.distanceKm) {
        best = {
          key: nodeKey(x.id, ic.id),
          expresswayId: x.id,
          expresswayShortName: x.shortName,
          interchangeId: ic.id,
          interchangeName: ic.name,
          distanceKm,
        }
      }
    }
  }
  return best
}

const buildGraph = (expressways: Expressway[], classId: VehicleClassId) => {
  const nodes = new Map<string, GraphNode>()
  const adjacency = new Map<string, { to: string; cost: number }[]>()

  const addEdge = (from: string, to: string, cost: number) => {
    if (!adjacency.has(from)) adjacency.set(from, [])
    adjacency.get(from)!.push({ to, cost })
  }

  for (const x of expressways) {
    x.interchanges.forEach((ic) => {
      nodes.set(nodeKey(x.id, ic.id), { key: nodeKey(x.id, ic.id), expressway: x, interchange: ic })
    })
    // Connect consecutive interchanges (data is stored in physical order).
    for (let i = 0; i < x.interchanges.length - 1; i++) {
      const a = x.interchanges[i]!
      const b = x.interchanges[i + 1]!
      const cost = segmentCost(x, a.id, b.id, classId) ?? 0
      const ka = nodeKey(x.id, a.id)
      const kb = nodeKey(x.id, b.id)
      addEdge(ka, kb, cost)
      addEdge(kb, ka, cost)
    }
  }

  // Free transfer edges at physical junctions between expressways.
  for (const c of CONNECTIONS) {
    const ka = nodeKey(c.a.expresswayId, c.a.interchangeId)
    const kb = nodeKey(c.b.expresswayId, c.b.interchangeId)
    if (nodes.has(ka) && nodes.has(kb)) {
      addEdge(ka, kb, 0)
      addEdge(kb, ka, 0)
    }
  }

  return { nodes, adjacency }
}

/** Dijkstra shortest (cheapest-toll) path. Returns the ordered node keys or null. */
const shortestPath = (
  adjacency: Map<string, { to: string; cost: number }[]>,
  allKeys: Iterable<string>,
  startKey: string,
  endKey: string,
): string[] | null => {
  const dist = new Map<string, number>()
  const prev = new Map<string, string>()
  const visited = new Set<string>()
  for (const k of allKeys) dist.set(k, Infinity)
  dist.set(startKey, 0)

  while (true) {
    // Pick the unvisited node with the smallest tentative distance.
    let current: string | null = null
    let currentDist = Infinity
    for (const [k, d] of dist) {
      if (!visited.has(k) && d < currentDist) {
        current = k
        currentDist = d
      }
    }
    if (current === null || currentDist === Infinity) break
    if (current === endKey) break
    visited.add(current)

    for (const edge of adjacency.get(current) ?? []) {
      if (visited.has(edge.to)) continue
      const alt = currentDist + edge.cost
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt)
        prev.set(edge.to, current)
      }
    }
  }

  if (!prev.has(endKey) && startKey !== endKey) return null
  const path: string[] = [endKey]
  let cursor = endKey
  while (cursor !== startKey) {
    const p = prev.get(cursor)
    if (p === undefined) return null
    path.push(p)
    cursor = p
  }
  return path.reverse()
}

/**
 * Plan the cheapest tolled route between two places for a vehicle class.
 * Snaps each place to its nearest interchange, then routes across the network.
 */
export const planRoute = (
  expressways: Expressway[],
  origin: LatLng,
  destination: LatLng,
  classId: VehicleClassId,
): RouteResult => {
  if (expressways.length === 0) {
    return { ok: false, message: 'No toll data available.', legs: [], total: 0 }
  }

  const entry = nearestInterchange(expressways, origin)
  const exit = nearestInterchange(expressways, destination)
  if (!entry || !exit) {
    return { ok: false, message: 'Could not locate nearby interchanges.', legs: [], total: 0 }
  }

  const stripKey = ({ key: _key, ...rest }: SnappedPoint & { key: string }): SnappedPoint => rest

  if (entry.key === exit.key) {
    return {
      ok: true,
      message: 'Origin and destination are nearest to the same interchange — no toll expressway needed.',
      entry: stripKey(entry),
      exit: stripKey(exit),
      legs: [],
      total: 0,
    }
  }

  const { nodes, adjacency } = buildGraph(expressways, classId)
  const path = shortestPath(adjacency, nodes.keys(), entry.key, exit.key)
  if (!path) {
    return {
      ok: false,
      message: 'No connected toll route between those places.',
      entry: stripKey(entry),
      exit: stripKey(exit),
      legs: [],
      total: 0,
    }
  }

  // Group the path into legs by expressway (transfers happen at shared junctions).
  const legs: RouteLeg[] = []
  let i = 0
  while (i < path.length) {
    const startNode = nodes.get(path[i]!)!
    let j = i
    while (j + 1 < path.length && nodes.get(path[j + 1]!)!.expressway.id === startNode.expressway.id) {
      j++
    }
    const endNode = nodes.get(path[j]!)!
    if (startNode.interchange.id !== endNode.interchange.id) {
      const cost = segmentCost(
        startNode.expressway,
        startNode.interchange.id,
        endNode.interchange.id,
        classId,
      )
      if (cost != null && cost > 0) {
        legs.push({
          expresswayId: startNode.expressway.id,
          expresswayName: startNode.expressway.shortName,
          fromId: startNode.interchange.id,
          fromName: startNode.interchange.name,
          toId: endNode.interchange.id,
          toName: endNode.interchange.name,
          cost,
        })
      }
    }
    i = j + 1
  }

  const total = legs.reduce((sum, leg) => sum + leg.cost, 0)
  return { ok: true, entry: stripKey(entry), exit: stripKey(exit), legs, total }
}
