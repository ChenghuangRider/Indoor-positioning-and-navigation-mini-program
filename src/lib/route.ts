// A* 路径规划：最短 / 无障碍 / 商业三种模式 + 分步指引生成
import { EDGES, NODES, dist, nodeById, walkSeconds } from '@/data/station'
import type { EdgeKind, FloorId, RouteMode, RouteResult, RouteStep } from '@/types'

const FLOOR_ORDER: Record<FloorId, number> = { B1: 0, F1: 1, F2: 2 }

function edgeCost(kind: EdgeKind, d: number, mode: RouteMode, commercial?: boolean): number {
  if (mode === 'barrier_free' && (kind === 'stairs' || kind === 'escalator')) return Infinity
  let cost = d
  if (kind === 'stairs') cost = d + 25 // 楼梯惩罚
  if (kind === 'elevator') cost = d + 40 // 等电梯惩罚（约60s折算）
  if (kind === 'escalator') cost = d + 15
  if (mode === 'commercial' && commercial) cost *= 0.5 // 商业路径偏好途经商铺
  return cost
}

interface AdjEdge {
  to: string
  kind: EdgeKind
  commercial?: boolean
  d: number
}

const adj = new Map<string, AdjEdge[]>()
for (const e of EDGES) {
  const na = nodeById(e.a)
  const nb = nodeById(e.b)
  const d = dist(na, nb)
  if (!adj.has(e.a)) adj.set(e.a, [])
  if (!adj.has(e.b)) adj.set(e.b, [])
  adj.get(e.a)!.push({ to: e.b, kind: e.kind, commercial: e.commercial, d })
  adj.get(e.b)!.push({ to: e.a, kind: e.kind, commercial: e.commercial, d })
}

export function planRoute(fromNodeId: string, toNodeId: string, mode: RouteMode): RouteResult | null {
  const goal = nodeById(toNodeId)
  const open: { id: string; f: number }[] = [{ id: fromNodeId, f: 0 }]
  const gScore = new Map<string, number>([[fromNodeId, 0]])
  const cameFrom = new Map<string, string>()
  const edgeKind = new Map<string, EdgeKind>()
  const closed = new Set<string>()

  while (open.length) {
    open.sort((x, y) => x.f - y.f)
    const cur = open.shift()!.id
    if (cur === toNodeId) {
      // 还原路径
      const ids = [cur]
      let c = cur
      while (cameFrom.has(c)) {
        c = cameFrom.get(c)!
        ids.unshift(c)
      }
      return buildResult(ids, edgeKind, mode)
    }
    closed.add(cur)
    for (const e of adj.get(cur) ?? []) {
      if (closed.has(e.to)) continue
      const cost = edgeCost(e.kind, e.d, mode, e.commercial)
      if (!isFinite(cost)) continue
      const tentative = (gScore.get(cur) ?? Infinity) + cost
      if (tentative < (gScore.get(e.to) ?? Infinity)) {
        cameFrom.set(e.to, cur)
        edgeKind.set(e.to, e.kind)
        gScore.set(e.to, tentative)
        const h = dist(nodeById(e.to), goal) + Math.abs(FLOOR_ORDER[nodeById(e.to).floor] - FLOOR_ORDER[goal.floor]) * 30
        open.push({ id: e.to, f: tentative + h })
      }
    }
  }
  return null
}

function buildResult(nodeIds: string[], edgeKind: Map<string, EdgeKind>, mode: RouteMode): RouteResult {
  const nodes = nodeIds.map(nodeById)
  // 总距离（不含垂直惩罚的纯步行距离）
  let distance = 0
  for (let i = 1; i < nodes.length; i++) distance += dist(nodes[i - 1], nodes[i])
  const crossFloor = new Set(nodes.map((n) => n.floor)).size > 1

  // 生成步骤
  const steps: RouteStep[] = []
  const kindLabel: Record<EdgeKind, string> = {
    walk: '',
    stairs: '走楼梯',
    escalator: '乘扶梯',
    elevator: '乘无障碍电梯',
  }
  let segPoints: RouteStep['points'] = [nodes[0]]
  let segDist = 0
  let segText = ''
  let prevDir = 0

  const flush = () => {
    if (!segText) return
    steps.push({ text: segText, points: segPoints, distance: Math.round(segDist) })
  }

  for (let i = 1; i < nodes.length; i++) {
    const from = nodes[i - 1]
    const to = nodes[i]
    const kind = edgeKind.get(to.id) ?? 'walk'
    const d = dist(from, to)

    if (kind !== 'walk') {
      flush()
      const dir = FLOOR_ORDER[to.floor] > FLOOR_ORDER[from.floor] ? '上' : '下'
      const floorName = to.floor === 'F2' ? '2F 候车层' : to.floor === 'F1' ? '1F 进站大厅' : 'B1 地铁站厅'
      steps.push({
        text: `${kindLabel[kind]}${dir}至 ${floorName}`,
        points: [from, to],
        distance: 0,
      })
      segPoints = [to]
      segDist = 0
      segText = ''
      prevDir = 0
      continue
    }

    const ang = Math.atan2(to.y - from.y, to.x - from.x)
    if (!segText) {
      segPoints.push(to)
      segDist = d
      segText = `沿${from.label ? from.label + '方向' : '通道'}前行`
      prevDir = ang
    } else {
      let delta = ang - prevDir
      while (delta > Math.PI) delta -= 2 * Math.PI
      while (delta < -Math.PI) delta += 2 * Math.PI
      if (Math.abs(delta) > Math.PI / 4 && segDist > 8) {
        const turn = delta > 0 ? '右转' : '左转'
        segText += `，${turn}`
        segPoints.push(to)
        segDist += d
        prevDir = ang
      } else {
        segPoints.push(to)
        segDist += d
        prevDir = ang
      }
    }
  }
  flush()
  // 距离写入步骤文案
  for (const s of steps) {
    if (s.distance > 0) s.text += ` ${Math.round(s.distance)} 米`
  }

  const elevatorCount = nodeIds.filter((id) => edgeKind.get(id) === 'elevator').length
  const seconds = walkSeconds(distance, mode === 'barrier_free') + elevatorCount * 60 + (crossFloor ? 20 : 0)
  return { nodeIds, distance, seconds, steps, crossFloor }
}

// 距某坐标最近的可行走节点
export function nearestNodeId(x: number, y: number, floor: FloorId): string {
  let best = ''
  let bestD = Infinity
  for (const n of NODES) {
    if (n.floor !== floor) continue
    const d = dist(n, { x, y })
    if (d < bestD) {
      bestD = d
      best = n.id
    }
  }
  return best
}
