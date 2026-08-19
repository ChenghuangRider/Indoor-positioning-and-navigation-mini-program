// 济南西站 Demo 数据：路网、POI、广告、搜索同义词库
import type { FloorId, NavEdge, NavNode, Poi, PoiCategory } from '@/types'

export const STATION_NAME = '济南西站'

export const FLOORS: { id: FloorId; name: string }[] = [
  { id: 'F2', name: '2F 候车层' },
  { id: 'F1', name: '1F 进站大厅' },
  { id: 'B1', name: 'B1 地铁站厅' },
]

// ── 路网节点（坐标单位≈米，SVG 视图 360×300） ─────────────────────────────
export const NODES: NavNode[] = [
  // B1 地铁站厅
  { id: 'b1_metro', floor: 'B1', x: 40, y: 150, label: '地铁1号线站台' },
  { id: 'b1_gate', floor: 'B1', x: 180, y: 150, label: '出站闸机' },
  { id: 'b1_taxi', floor: 'B1', x: 320, y: 150, label: '出租车乘车点' },
  { id: 'b1_park', floor: 'B1', x: 180, y: 60, label: '停车场' },
  { id: 'b1_esc', floor: 'B1', x: 300, y: 240, label: '扶梯口' },
  { id: 'b1_elev', floor: 'B1', x: 60, y: 60, label: '无障碍电梯' },

  // F1 进站大厅
  { id: 'f1_entry', floor: 'F1', x: 40, y: 240, label: '进站口' },
  { id: 'f1_wcorr', floor: 'F1', x: 40, y: 150, label: '西侧走廊' },
  { id: 'f1_center', floor: 'F1', x: 180, y: 150, label: '大厅中央' },
  { id: 'f1_wc', floor: 'F1', x: 260, y: 150, label: '卫生间A' },
  { id: 'f1_ecorr', floor: 'F1', x: 320, y: 150, label: '东侧走廊' },
  { id: 'f1_security', floor: 'F1', x: 120, y: 240, label: '安检口' },
  { id: 'f1_ticket', floor: 'F1', x: 260, y: 240, label: '售票厅' },
  { id: 'f1_esc_b1', floor: 'F1', x: 300, y: 240, label: '下行扶梯' },
  { id: 'f1_food', floor: 'F1', x: 120, y: 60, label: '餐饮区' },
  { id: 'f1_esc_f2', floor: 'F1', x: 180, y: 60, label: '上行扶梯' },
  { id: 'f1_stairs', floor: 'F1', x: 300, y: 60, label: '楼梯' },
  { id: 'f1_elev', floor: 'F1', x: 60, y: 60, label: '无障碍电梯' },

  // F2 候车层
  { id: 'f2_esc', floor: 'F2', x: 180, y: 60, label: '扶梯口' },
  { id: 'f2_stairs', floor: 'F2', x: 300, y: 60, label: '楼梯' },
  { id: 'f2_elev', floor: 'F2', x: 60, y: 60, label: '无障碍电梯' },
  { id: 'f2_corr_w', floor: 'F2', x: 60, y: 150, label: '西翼走廊' },
  { id: 'f2_corr_c', floor: 'F2', x: 180, y: 150, label: '中央走廊' },
  { id: 'f2_corr_e', floor: 'F2', x: 300, y: 150, label: '东翼走廊' },
  { id: 'f2_hall', floor: 'F2', x: 180, y: 200, label: '候车厅' },
  { id: 'f2_gate12a', floor: 'F2', x: 130, y: 250, label: '检票口12A' },
  { id: 'f2_gate12b', floor: 'F2', x: 180, y: 250, label: '检票口12B' },
  { id: 'f2_gate13a', floor: 'F2', x: 240, y: 250, label: '检票口13A' },
  { id: 'f2_mom', floor: 'F2', x: 90, y: 210, label: '母婴室' },
  { id: 'f2_wc', floor: 'F2', x: 300, y: 210, label: '卫生间B' },
]

// ── 路网边 ───────────────────────────────────────────────────────────────
export const EDGES: NavEdge[] = [
  // B1
  { a: 'b1_metro', b: 'b1_gate', kind: 'walk' },
  { a: 'b1_gate', b: 'b1_taxi', kind: 'walk' },
  { a: 'b1_gate', b: 'b1_park', kind: 'walk' },
  { a: 'b1_park', b: 'b1_elev', kind: 'walk' },
  { a: 'b1_taxi', b: 'b1_esc', kind: 'walk' },
  // B1 ↔ F1
  { a: 'b1_esc', b: 'f1_esc_b1', kind: 'escalator' },
  { a: 'b1_elev', b: 'f1_elev', kind: 'elevator' },
  // F1
  { a: 'f1_entry', b: 'f1_wcorr', kind: 'walk' },
  { a: 'f1_entry', b: 'f1_security', kind: 'walk' },
  { a: 'f1_security', b: 'f1_ticket', kind: 'walk' },
  { a: 'f1_ticket', b: 'f1_esc_b1', kind: 'walk' },
  { a: 'f1_wcorr', b: 'f1_center', kind: 'walk', commercial: true },
  { a: 'f1_center', b: 'f1_wc', kind: 'walk', commercial: true },
  { a: 'f1_wc', b: 'f1_ecorr', kind: 'walk' },
  { a: 'f1_center', b: 'f1_esc_f2', kind: 'walk', commercial: true },
  { a: 'f1_esc_f2', b: 'f1_food', kind: 'walk', commercial: true },
  { a: 'f1_food', b: 'f1_elev', kind: 'walk' },
  { a: 'f1_esc_f2', b: 'f1_stairs', kind: 'walk' },
  { a: 'f1_security', b: 'f1_center', kind: 'walk' },
  // F1 ↔ F2
  { a: 'f1_esc_f2', b: 'f2_esc', kind: 'escalator' },
  { a: 'f1_stairs', b: 'f2_stairs', kind: 'stairs' },
  { a: 'f1_elev', b: 'f2_elev', kind: 'elevator' },
  // F2
  { a: 'f2_elev', b: 'f2_esc', kind: 'walk' },
  { a: 'f2_esc', b: 'f2_stairs', kind: 'walk' },
  { a: 'f2_esc', b: 'f2_corr_c', kind: 'walk', commercial: true },
  { a: 'f2_corr_w', b: 'f2_corr_c', kind: 'walk', commercial: true },
  { a: 'f2_corr_c', b: 'f2_corr_e', kind: 'walk', commercial: true },
  { a: 'f2_corr_c', b: 'f2_hall', kind: 'walk' },
  { a: 'f2_hall', b: 'f2_gate12a', kind: 'walk' },
  { a: 'f2_hall', b: 'f2_gate12b', kind: 'walk' },
  { a: 'f2_hall', b: 'f2_gate13a', kind: 'walk' },
  { a: 'f2_corr_w', b: 'f2_mom', kind: 'walk' },
  { a: 'f2_corr_e', b: 'f2_wc', kind: 'walk' },
  { a: 'f2_corr_w', b: 'f2_elev', kind: 'walk' },
]

// ── POI ──────────────────────────────────────────────────────────────────
export const POIS: Poi[] = [
  // F1
  { id: 'p_entry', name: '进站口', pinyin: 'jinzhankou', aliases: ['jzk', '入口', '进站'], category: 'ticket', sub: '进站', floor: 'F1', node: 'f1_entry', icon: '🚪', accessible: true },
  { id: 'p_security', name: '安检口', pinyin: 'anjian', aliases: ['ajk', '安检'], category: 'ticket', sub: '安检口', floor: 'F1', node: 'f1_security', icon: '🛂', accessible: true },
  { id: 'p_ticket', name: '售票厅', pinyin: 'shoupiaoting', aliases: ['spt', '买票', '取票'], category: 'ticket', sub: '售票', floor: 'F1', node: 'f1_ticket', icon: '🎫', accessible: true },
  { id: 'p_info', name: '问询台', pinyin: 'wenxuntai', aliases: ['wxt', '咨询', '服务台'], category: 'facility', sub: '问询台', floor: 'F1', node: 'f1_center', icon: '💁', accessible: true },
  { id: 'p_wc_a', name: '卫生间A', pinyin: 'weishengjian', aliases: ['wsj', 'wc', '厕所', '洗手间', 'toilet'], category: 'service', sub: '卫生间', floor: 'F1', node: 'f1_wc', icon: '🚻', accessible: true },
  { id: 'p_exit_e', name: '出入口·东', pinyin: 'churukou', aliases: ['crk', '出口', '东门'], category: 'transport', sub: '出入口', floor: 'F1', node: 'f1_ecorr', icon: '🚪', accessible: true },
  { id: 'p_exit_w', name: '出入口·西', pinyin: 'churukouxi', aliases: ['crk', '出口', '西门'], category: 'transport', sub: '出入口', floor: 'F1', node: 'f1_wcorr', icon: '🚪', accessible: true },
  { id: 'p_mcd', name: '麦当劳', pinyin: 'maidanglao', aliases: ['mdl', 'mcd', '汉堡'], category: 'shop', sub: '餐饮', floor: 'F1', node: 'f1_food', icon: '🍔', accessible: true, hours: '06:30-22:00', open: true, ad: { title: '麦当劳 · 麦乐送', desc: '全场满 30 减 10', coupon: '满30减10' } },
  { id: 'p_starbucks', name: '星巴克', pinyin: 'xingbake', aliases: ['xbk', 'starbucks', '咖啡'], category: 'shop', sub: '餐饮', floor: 'F1', node: 'f1_food', icon: '☕', accessible: true, hours: '07:00-21:30', open: true, ad: { title: '星巴克 · 限时优惠', desc: '凭券全场 8 折', coupon: '限时8折' } },
  { id: 'p_store1', name: '便利蜂便利店', pinyin: 'bianlifeng', aliases: ['blf', '便利店', '超市'], category: 'shop', sub: '便利店', floor: 'F1', node: 'f1_ecorr', icon: '🏪', accessible: true, hours: '24小时', open: true, ad: { title: '便利蜂', desc: '早餐套餐立减 5 元', coupon: '立减5元' } },
  { id: 'p_atm', name: '工商银行ATM', pinyin: 'gongshangATM', aliases: ['atm', '取钱', '银行'], category: 'shop', sub: 'ATM', floor: 'F1', node: 'f1_ticket', icon: '🏧', accessible: true, open: true },
  { id: 'p_elev_f1', name: '无障碍电梯(1F)', pinyin: 'wuzhangaidianti', aliases: ['dt', '电梯'], category: 'service', sub: '无障碍电梯', floor: 'F1', node: 'f1_elev', icon: '🛗', accessible: true },
  { id: 'p_water_f1', name: '饮水处(1F)', pinyin: 'yinshuichu', aliases: ['ysc', '喝水', '热水'], category: 'facility', sub: '饮水处', floor: 'F1', node: 'f1_food', icon: '🚰', accessible: true },
  // F2
  { id: 'p_g12a', name: '检票口 12A', pinyin: 'jianpiaokou12A', aliases: ['jpk', '12a', 'gate12a'], category: 'ticket', sub: '检票口', floor: 'F2', node: 'f2_gate12a', icon: '🎫', accessible: true },
  { id: 'p_g12b', name: '检票口 12B', pinyin: 'jianpiaokou12B', aliases: ['jpk', '12b'], category: 'ticket', sub: '检票口', floor: 'F2', node: 'f2_gate12b', icon: '🎫', accessible: true },
  { id: 'p_g13a', name: '检票口 13A', pinyin: 'jianpiaokou13A', aliases: ['jpk', '13a'], category: 'ticket', sub: '检票口', floor: 'F2', node: 'f2_gate13a', icon: '🎫', accessible: true },
  { id: 'p_hall', name: '候车厅', pinyin: 'houcheting', aliases: ['hct', '候车', '休息'], category: 'ticket', sub: '候车厅', floor: 'F2', node: 'f2_hall', icon: '🪑', accessible: true },
  { id: 'p_wc_b', name: '卫生间B', pinyin: 'weishengjianB', aliases: ['wsj', 'wc', '厕所', '洗手间'], category: 'service', sub: '卫生间', floor: 'F2', node: 'f2_wc', icon: '🚻', accessible: true },
  { id: 'p_mom', name: '母婴室', pinyin: 'muyingshi', aliases: ['mys', '母婴'], category: 'service', sub: '母婴室', floor: 'F2', node: 'f2_mom', icon: '🍼', accessible: true },
  { id: 'p_book', name: '泉城书房', pinyin: 'quanchengshufang', aliases: ['sd', '书店', '书'], category: 'shop', sub: '书店', floor: 'F2', node: 'f2_corr_c', icon: '📚', accessible: true, hours: '08:00-21:00', open: true, ad: { title: '泉城书房', desc: '图书满 50 减 15', coupon: '满50减15' } },
  { id: 'p_charge', name: '手机充电站', pinyin: 'shoujichongdianzhan', aliases: ['cdz', '充电', '充电宝'], category: 'facility', sub: '充电站', floor: 'F2', node: 'f2_corr_e', icon: '🔌', accessible: true },
  { id: 'p_water_f2', name: '饮水处(2F)', pinyin: 'yinshuichu2', aliases: ['ysc', '喝水'], category: 'facility', sub: '饮水处', floor: 'F2', node: 'f2_corr_w', icon: '🚰', accessible: true },
  { id: 'p_elev_f2', name: '无障碍电梯(2F)', pinyin: 'wuzhangaidianti2', aliases: ['dt', '电梯'], category: 'service', sub: '无障碍电梯', floor: 'F2', node: 'f2_elev', icon: '🛗', accessible: true },
  // B1
  { id: 'p_metro', name: '地铁1号线站台', pinyin: 'ditieyihaoxian', aliases: ['dt', '地铁', 'metro'], category: 'transport', sub: '地铁出入口', floor: 'B1', node: 'b1_metro', icon: '🚇', accessible: true },
  { id: 'p_b1gate', name: '出站闸机', pinyin: 'chuzhanzhaji', aliases: ['czj', '闸机', '出站'], category: 'transport', sub: '闸机', floor: 'B1', node: 'b1_gate', icon: '🚧', accessible: true },
  { id: 'p_taxi', name: '出租车乘车点', pinyin: 'chuzuche', aliases: ['czc', '出租车', '打车', 'taxi'], category: 'transport', sub: '出租车', floor: 'B1', node: 'b1_taxi', icon: '🚕', accessible: true },
  { id: 'p_park', name: '地下停车场', pinyin: 'dixiatingchechang', aliases: ['tcc', '停车场', '找车', '寻车'], category: 'transport', sub: '停车场', floor: 'B1', node: 'b1_park', icon: '🅿️', accessible: true },
  { id: 'p_elev_b1', name: '无障碍电梯(B1)', pinyin: 'wuzhangaidiantiB1', aliases: ['dt', '电梯'], category: 'service', sub: '无障碍电梯', floor: 'B1', node: 'b1_elev', icon: '🛗', accessible: true },
]

// ── 分类配置 ─────────────────────────────────────────────────────────────
export const CATEGORIES: { key: PoiCategory | 'all'; name: string; icon: string }[] = [
  { key: 'all', name: '全部', icon: '🗂️' },
  { key: 'transport', name: '交通接驳', icon: '🚇' },
  { key: 'ticket', name: '检票乘车', icon: '🎫' },
  { key: 'service', name: '公共服务', icon: '🚻' },
  { key: 'shop', name: '商业服务', icon: '🛒' },
  { key: 'facility', name: '便民设施', icon: '🔌' },
]

// ── 快捷查找（首页底部） ──────────────────────────────────────────────────
export const QUICK_FIND = [
  { key: 'wc', name: '卫生间', icon: '🚻', match: (p: Poi) => p.sub === '卫生间' },
  { key: 'gate', name: '检票口', icon: '🎫', match: (p: Poi) => p.sub === '检票口' },
  { key: 'exit', name: '出入口', icon: '🚪', match: (p: Poi) => p.sub === '出入口' },
  { key: 'food', name: '餐饮', icon: '🍔', match: (p: Poi) => p.sub === '餐饮' },
]

// ── 沿途搜 ────────────────────────────────────────────────────────────────
export const ALONG_SEARCH = [
  { key: 'wc', name: '卫生间', icon: '🚻', match: (p: Poi) => p.sub === '卫生间' },
  { key: 'water', name: '饮水处', icon: '🚰', match: (p: Poi) => p.sub === '饮水处' },
  { key: 'charge', name: '充电站', icon: '🔌', match: (p: Poi) => p.sub === '充电站' },
]

// ── 美食排行榜（饭点推送） ────────────────────────────────────────────────
export const FOOD_RANKING = ['麦当劳', '星巴克', '便利蜂便利店']

export function nodeById(id: string): NavNode {
  const n = NODES.find((n) => n.id === id)
  if (!n) throw new Error('unknown node ' + id)
  return n
}

export function poiById(id: string): Poi | undefined {
  return POIS.find((p) => p.id === id)
}

// ── 模糊搜索：名称 / 拼音 / 首字母 / 同义词 ──────────────────────────────
export function searchPois(keyword: string): Poi[] {
  const k = keyword.trim().toLowerCase()
  if (!k) return []
  return POIS.filter((p) => {
    const fields = [p.name, p.sub, p.pinyin, ...p.aliases].map((s) => s.toLowerCase())
    return fields.some((f) => f.includes(k))
  })
}

// 距离（米）
export function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

// 步行时间（秒）：1.2 m/s；无障碍 0.8 m/s
export function walkSeconds(meters: number, barrierFree = false): number {
  return Math.round(meters / (barrierFree ? 0.8 : 1.2))
}

export function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const m = Math.round(seconds / 60)
  return `约${m}分钟`
}

export function fmtDist(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}公里` : `${Math.round(meters)}米`
}
