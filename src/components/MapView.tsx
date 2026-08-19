// SVG 室内地图渲染：走廊路网 + POI 标注 + 定位蓝点 + 路径高亮
import { useMemo } from 'react'
import { EDGES, NODES, POIS, nodeById } from '@/data/station'
import type { FloorId, Poi, SimPosition } from '@/types'

interface Props {
  floor: FloorId
  position: SimPosition
  path?: string[] // 路径节点 id（可跨楼层，仅渲染当前层段）
  emergencyPath?: string[]
  destPoi?: Poi | null
  onPoiClick?: (poi: Poi) => void
  onMapClick?: (pos: SimPosition) => void
  highlightPoiId?: string
}

const VERTICAL_ICON: Record<string, string> = {
  stairs: '梯',
  escalator: '扶',
  elevator: '电',
}

export default function MapView({
  floor,
  position,
  path,
  emergencyPath,
  destPoi,
  onPoiClick,
  onMapClick,
  highlightPoiId,
}: Props) {
  const floorNodes = useMemo(() => NODES.filter((n) => n.floor === floor), [floor])
  const floorEdges = useMemo(
    () =>
      EDGES.filter((e) => {
        const a = nodeById(e.a)
        const b = nodeById(e.b)
        return a.floor === floor && b.floor === floor && e.kind === 'walk'
      }),
    [floor],
  )
  const floorPois = useMemo(() => POIS.filter((p) => p.floor === floor), [floor])
  const verticalNodes = useMemo(() => {
    const set = new Map<string, string>()
    for (const e of EDGES) {
      if (e.kind === 'walk') continue
      for (const id of [e.a, e.b]) {
        const n = nodeById(id)
        if (n.floor === floor) set.set(id, VERTICAL_ICON[e.kind])
      }
    }
    return set
  }, [floor])

  const pathPoints = useMemo(() => {
    if (!path) return null
    const pts = path.map(nodeById).filter((n) => n.floor === floor)
    if (pts.length < 2) return null
    return pts.map((n) => `${n.x},${n.y}`).join(' ')
  }, [path, floor])

  const emPoints = useMemo(() => {
    if (!emergencyPath) return null
    const pts = emergencyPath.map(nodeById).filter((n) => n.floor === floor)
    if (pts.length < 2) return null
    return pts.map((n) => `${n.x},${n.y}`).join(' ')
  }, [emergencyPath, floor])

  const destNode = destPoi ? nodeById(destPoi.node) : null

  return (
    <svg
      viewBox="0 0 360 300"
      className="w-full h-full select-none"
      style={{ background: '#F5F0E8' }}
      onClick={(e) => {
        if (!onMapClick) return
        const svg = e.currentTarget
        const rect = svg.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 360
        const y = ((e.clientY - rect.top) / rect.height) * 300
        onMapClick({ floor, x, y })
      }}
    >
      <defs>
        <pattern id="water" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20 q10 -8 20 0 t20 0" stroke="#D8ECF7" strokeWidth="1.5" fill="none" />
        </pattern>
      </defs>
      {/* 泉水波纹底纹 */}
      <rect x="0" y="0" width="360" height="300" fill="url(#water)" opacity="0.6" />

      {/* 建筑轮廓装饰 */}
      <rect x="14" y="14" width="332" height="272" rx="18" fill="#FDFBF6" stroke="#E3D9C6" strokeWidth="2" />

      {/* 走廊 */}
      {floorEdges.map((e, i) => {
        const a = nodeById(e.a)
        const b = nodeById(e.b)
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#E8E2D2" strokeWidth="16" strokeLinecap="round" />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#FDFBF6" strokeWidth="12" strokeLinecap="round" />
          </g>
        )
      })}

      {/* 应急疏散路径 */}
      {emPoints && (
        <polyline points={emPoints} fill="none" stroke="#F5222D" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 6" className="em-dash" />
      )}

      {/* 导航路径 */}
      {pathPoints && (
        <>
          <polyline points={pathPoints} fill="none" stroke="#4A90D9" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
          <polyline points={pathPoints} fill="none" stroke="#4A90D9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="route-dash" />
        </>
      )}

      {/* 垂直交通标识 */}
      {[...verticalNodes.entries()].map(([id, icon]) => {
        const n = nodeById(id)
        return (
          <g key={id}>
            <circle cx={n.x} cy={n.y} r="10" fill="#fff" stroke="#3EC1D3" strokeWidth="2" />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="10" fill="#3EC1D3">
              {icon}
            </text>
          </g>
        )
      })}

      {/* 走廊节点（弱化） */}
      {floorNodes.map((n) => (
        <circle key={n.id} cx={n.x} cy={n.y} r="2.5" fill="#D5CDB8" />
      ))}

      {/* POI 标注 */}
      {floorPois.map((p, idx) => {
        const n = nodeById(p.node)
        const ox = ((idx % 3) - 1) * 14
        const oy = -14 - (idx % 2) * 12
        const isDest = destPoi?.id === p.id
        const isHl = highlightPoiId === p.id
        return (
          <g
            key={p.id}
            transform={`translate(${n.x + ox},${n.y + oy})`}
            onClick={(e) => {
              e.stopPropagation()
              onPoiClick?.(p)
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle
              r={isDest || isHl ? 13 : 11}
              fill={isDest ? '#5DBE8A' : isHl ? '#FFB020' : '#fff'}
              stroke={isDest ? '#3D9B6A' : isHl ? '#E89A00' : '#4A90D9'}
              strokeWidth="2"
            />
            <text y="4" textAnchor="middle" fontSize="10">
              {p.icon}
            </text>
            <text y="22" textAnchor="middle" fontSize="8.5" fill="#555" fontWeight={isDest ? 700 : 400}>
              {p.name.length > 6 ? p.name.slice(0, 6) : p.name}
            </text>
            {isDest && (
              <circle r="17" fill="none" stroke="#5DBE8A" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="r" values="13;19" dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0" dur="1.4s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        )
      })}

      {/* 终点旗标 */}
      {destNode && destNode.floor === floor && (
        <g transform={`translate(${destNode.x},${destNode.y})`}>
          <text y="-16" textAnchor="middle" fontSize="14">🏁</text>
        </g>
      )}

      {/* 用户位置蓝点 */}
      {position.floor === floor && (
        <g transform={`translate(${position.x},${position.y})`}>
          <circle r="16" fill="#4A90D9" opacity="0.15">
            <animate attributeName="r" values="10;18" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0.05" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle r="7" fill="#4A90D9" stroke="#fff" strokeWidth="2.5" />
          <circle r="2.5" fill="#fff" />
        </g>
      )}
    </svg>
  )
}
