// 泉城智行 Demo 类型定义

export type FloorId = 'B1' | 'F1' | 'F2'

export type RouteMode = 'shortest' | 'barrier_free' | 'commercial'

export type EdgeKind = 'walk' | 'stairs' | 'escalator' | 'elevator'

export interface NavNode {
  id: string
  floor: FloorId
  x: number
  y: number
  /** 节点名称（用于生成指引文案） */
  label?: string
}

export interface NavEdge {
  a: string
  b: string
  kind: EdgeKind
  /** 途经商铺区域（商业路径偏好） */
  commercial?: boolean
}

export type PoiCategory = 'transport' | 'ticket' | 'service' | 'shop' | 'facility'

export interface Poi {
  id: string
  name: string
  pinyin: string
  aliases: string[]
  category: PoiCategory
  sub: string
  floor: FloorId
  /** 挂接的路网节点 */
  node: string
  icon: string
  accessible: boolean
  hours?: string
  open?: boolean
  /** 商铺广告 */
  ad?: {
    title: string
    desc: string
    coupon: string
  }
}

export interface RouteStep {
  text: string
  /** 步骤涉及的路径点（按顺序） */
  points: { floor: FloorId; x: number; y: number }[]
  distance: number
}

export interface RouteResult {
  nodeIds: string[]
  distance: number
  /** 预计步行时间（秒） */
  seconds: number
  steps: RouteStep[]
  crossFloor: boolean
}

export interface SimPosition {
  floor: FloorId
  x: number
  y: number
}

export interface NavSession {
  dest: Poi
  mode: RouteMode
  route: RouteResult
}
