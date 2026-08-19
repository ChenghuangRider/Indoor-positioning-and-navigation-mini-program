// 目标速查页：分类 + 筛选 + 按距离排序 + 步行时间（F-FIND-02/03/04）
import { useMemo, useState } from 'react'
import PoiSheet from '@/components/PoiSheet'
import { CATEGORIES, POIS, dist, fmtDist, fmtTime, nodeById, walkSeconds } from '@/data/station'
import { useApp } from '@/store'
import type { Poi, PoiCategory } from '@/types'

export default function FindPage() {
  const { position } = useApp()
  const [cat, setCat] = useState<PoiCategory | 'all'>('all')
  const [onlyAccessible, setOnlyAccessible] = useState(false)
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [selected, setSelected] = useState<Poi | null>(null)

  const list = useMemo(() => {
    return POIS.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false
      if (onlyAccessible && !p.accessible) return false
      if (onlyOpen && p.category === 'shop' && p.open === false) return false
      return true
    })
      .map((p) => {
        const n = nodeById(p.node)
        const cross = n.floor !== position.floor
        const d = dist(n, position)
        const secs = walkSeconds(d, onlyAccessible) + (cross ? 60 : 0) // 跨楼层含电梯等待60s
        return { p, d, secs, cross }
      })
      .sort((a, b) => a.secs - b.secs)
  }, [cat, onlyAccessible, onlyOpen, position])

  return (
    <div className="h-full flex flex-col bg-[#F7F8FA]">
      <div className="px-4 pt-4 pb-2 bg-white">
        <h2 className="text-lg font-bold text-gray-900">目标速查</h2>
        <p className="text-xs text-gray-400 mt-0.5">按距离排序 · 显示步行预计时间</p>
        {/* 分类 */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${
                cat === c.key ? 'bg-[#4A90D9] text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
        {/* 筛选 */}
        <div className="flex gap-4 pb-1">
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            <input type="checkbox" checked={onlyAccessible} onChange={(e) => setOnlyAccessible(e.target.checked)} className="accent-[#4A90D9]" />
            仅无障碍可达
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="accent-[#4A90D9]" />
            仅营业中商铺
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {list.length === 0 && (
          <div className="flex flex-col items-center pt-16 text-gray-400">
            <span className="text-4xl">🍃</span>
            <p className="mt-2 text-sm">没有符合条件的地点</p>
          </div>
        )}
        {list.map(({ p, d, secs, cross }) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="w-full bg-white rounded-2xl p-3.5 mb-2 flex items-center gap-3 text-left shadow-sm"
          >
            <div className="w-11 h-11 rounded-xl bg-[#EAF3FC] flex items-center justify-center text-2xl shrink-0">
              {p.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                {p.open === false && <span className="text-[10px] px-1.5 rounded bg-gray-100 text-gray-400">歇业</span>}
                {p.ad && <span className="text-[10px] px-1.5 rounded bg-[#FFF0DD] text-[#FF7A00]">券</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {p.floor} · {p.sub} {p.accessible ? '· ♿' : ''} {cross ? '· 需跨楼层' : ''}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-[#4A90D9]">{fmtDist(d)}</p>
              <p className="text-[10px] text-gray-400">步行{fmtTime(secs)}</p>
            </div>
          </button>
        ))}
      </div>

      {selected && <PoiSheet poi={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
