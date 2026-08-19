// 首页：BIM 地图 + 搜索 + 楼层切换 + 快捷查找 + 地理围栏广告
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import MapView from '@/components/MapView'
import Mascot from '@/components/Mascot'
import PoiSheet from '@/components/PoiSheet'
import {
  FLOORS,
  POIS,
  QUICK_FIND,
  STATION_NAME,
  dist,
  fmtDist,
  nodeById,
  searchPois,
} from '@/data/station'
import { nearestNodeId, planRoute } from '@/lib/route'
import { useApp, useGeofenceAd } from '@/store'
import type { FloorId, Poi } from '@/types'

export default function HomePage({ onStartNav }: { onStartNav: () => void }) {
  const {
    position, moveTo, nearestNode, settings, startNav,
    emergency, setEmergency, markAdExposed,
  } = useApp()
  const [floor, setFloor] = useState<FloorId>('F1')
  const [searchOpen, setSearchOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null)
  const [stationOpen, setStationOpen] = useState(false)
  const adPoi = useGeofenceAd()
  const adShownRef = useRef(false)

  // 用户位置变化时自动跟随楼层（F-LOC-06）
  useEffect(() => {
    setFloor(position.floor)
  }, [position.floor])

  // 广告曝光记录（频控）
  useEffect(() => {
    if (adPoi && !adShownRef.current) {
      markAdExposed(adPoi.id)
      adShownRef.current = true
    }
    if (!adPoi) adShownRef.current = false
  }, [adPoi, markAdExposed])

  // 应急疏散路径（F-EM-01）
  const emergencyPath = useMemo(() => {
    if (!emergency) return undefined
    const exits = POIS.filter((p) => p.sub === '出入口')
    let best: { ids: string[]; d: number } | null = null
    for (const exit of exits) {
      const r = planRoute(nearestNode, exit.node, 'barrier_free')
      if (r && (!best || r.distance < best.d)) best = { ids: r.nodeIds, d: r.distance }
    }
    return best?.ids
  }, [emergency, nearestNode])

  const results = useMemo(() => searchPois(keyword), [keyword])

  const gotoPoi = (poi: Poi) => {
    const route = planRoute(nearestNode, poi.node, settings.routeMode)
    if (!route) {
      toast.error('该区域暂不可达')
      return
    }
    startNav(poi, route, settings.routeMode)
    setSearchOpen(false)
    setSelectedPoi(null)
    onStartNav()
  }

  const quickFind = (match: (p: Poi) => boolean, name: string) => {
    const cands = POIS.filter(match)
      .map((p) => {
        const n = nodeById(p.node)
        const d = dist(n, position) + (n.floor === position.floor ? 0 : 60)
        return { p, d }
      })
      .sort((a, b) => a.d - b.d)
    if (!cands.length) {
      toast.info(`未找到附近${name}`)
      return
    }
    gotoPoi(cands[0].p)
  }

  const handleMapClick = (pos: { floor: FloorId; x: number; y: number }) => {
    // Demo：点击地图模拟定位移动
    const nid = nearestNodeId(pos.x, pos.y, pos.floor)
    const n = nodeById(nid)
    moveTo({ floor: pos.floor, x: n.x, y: n.y })
    toast(`📍 模拟定位：已移动到「${n.label ?? nid}」`, { duration: 1200 })
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* 顶部栏 */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 bg-white/90 backdrop-blur z-10">
        <div className="relative">
          <button
            className="flex items-center gap-1 font-bold text-gray-900"
            onClick={() => setStationOpen(!stationOpen)}
          >
            {STATION_NAME} <span className="text-xs text-gray-400">▼</span>
          </button>
          {stationOpen && (
            <div className="absolute top-8 left-0 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-30">
              <button className="w-full text-left px-3 py-2 rounded-xl bg-[#EAF3FC] text-[#4A90D9] text-sm font-semibold">
                {STATION_NAME} <span className="text-xs font-normal">· 当前站点</span>
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-400"
                onClick={() => {
                  setStationOpen(false)
                  toast.info('该区域暂未开通室内导航，敬请期待')
                }}
              >
                遥墙国际机场 <span className="text-xs">· 暂未开通</span>
              </button>
            </div>
          )}
        </div>
        <button
          className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-400"
          onClick={() => setSearchOpen(true)}
        >
          🔍 搜索目的地，如"卫生间 / 12A"
        </button>
      </div>

      {/* 应急横幅 */}
      {emergency && (
        <div className="z-10 mx-3 mb-1 rounded-xl bg-[#F5222D] text-white text-sm px-4 py-2 flex items-center justify-between">
          <span>🚨 应急疏散模式：请沿红色虚线前往最近安全出口</span>
          <button onClick={() => setEmergency(false)} className="text-xs underline">退出</button>
        </div>
      )}

      {/* 地图区 */}
      <div className="relative flex-1 overflow-hidden">
        <MapView
          floor={floor}
          position={position}
          emergencyPath={emergencyPath}
          onPoiClick={setSelectedPoi}
          onMapClick={handleMapClick}
        />

        {/* 楼层切换（可手动纠正楼层 F-MAP-08） */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-white rounded-2xl shadow-lg p-1">
          {FLOORS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFloor(f.id)
                if (f.id !== position.floor) toast(`已切换到 ${f.name} 视图（演示：点击地图可模拟跨层移动）`, { duration: 1500 })
              }}
              className={`w-11 h-11 rounded-xl text-xs font-bold ${
                floor === f.id ? 'bg-[#4A90D9] text-white' : 'text-gray-500'
              } ${f.id === position.floor ? 'ring-2 ring-[#5DBE8A] ring-offset-1' : ''}`}
            >
              {f.id}
            </button>
          ))}
        </div>

        {/* 定位精度标识 */}
        <div className="absolute left-3 top-3 bg-white/90 rounded-full px-3 py-1 text-xs text-gray-500 shadow">
          📶 {settings.locMode === 'high' ? '蓝牙+WiFi · 精度1-3米' : '省电模式 · 仅WiFi'}
        </div>

        {/* 演示提示 */}
        <div className="absolute left-3 bottom-3 bg-black/50 text-white rounded-full px-3 py-1 text-[10px]">
          💡 演示模式：点击地图任意位置模拟行走定位
        </div>
      </div>

      {/* 地理围栏广告横幅 */}
      {adPoi?.ad && (
        <div className="z-10 mx-3 mb-2 rounded-2xl bg-gradient-to-r from-[#FF7A00] to-[#FFA940] text-white px-4 py-3 flex items-center gap-3 shadow-lg">
          <span className="text-2xl">{adPoi.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-bold">{adPoi.ad.title} · {adPoi.ad.desc}</p>
            <p className="text-[10px] opacity-80">附近 20 米 · 广告 · 2小时内不再提醒</p>
          </div>
          <button
            className="bg-white text-[#FF7A00] text-xs font-bold px-3 py-1.5 rounded-full"
            onClick={() => setSelectedPoi(adPoi)}
          >
            去看看
          </button>
        </div>
      )}

      {/* 快捷查找栏（F-FIND-01） */}
      <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-white border-t border-gray-100">
        {QUICK_FIND.map((q) => (
          <button
            key={q.key}
            onClick={() => quickFind(q.match, q.name)}
            className="flex flex-col items-center gap-1 py-2 rounded-2xl bg-[#F7F8FA] active:bg-[#EAF3FC]"
          >
            <span className="text-xl">{q.icon}</span>
            <span className="text-xs text-gray-600">{q.name}</span>
          </button>
        ))}
      </div>

      {/* 搜索弹层 */}
      {searchOpen && (
        <div className="absolute inset-0 z-40 bg-white flex flex-col">
          <div className="p-3 flex items-center gap-2 border-b border-gray-100">
            <button onClick={() => setSearchOpen(false)} className="text-gray-400 px-2">←</button>
            <input
              autoFocus
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索目的地，支持拼音/首字母"
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
            />
            <button
              className="w-9 h-9 rounded-full bg-[#EAF3FC] flex items-center justify-center"
              onClick={() => {
                const SR = (window as unknown as { webkitSpeechRecognition?: new () => {
                  lang: string
                  onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null
                  onerror: (() => void) | null
                  start: () => void
                } }).webkitSpeechRecognition
                if (!SR) {
                  toast.info('当前浏览器不支持语音输入，可直接打字搜索')
                  return
                }
                const rec = new SR()
                rec.lang = 'zh-CN'
                rec.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => setKeyword(e.results[0][0].transcript)
                rec.onerror = () => toast.info('语音识别失败，请重试')
                rec.start()
                toast('🎤 请说出目的地…')
              }}
            >
              🎤
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!keyword && (
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-3">热门搜索</p>
                <div className="flex flex-wrap gap-2">
                  {['卫生间', '检票口 12A', '麦当劳', '出租车', '母婴室', '充电'].map((k) => (
                    <button
                      key={k}
                      onClick={() => setKeyword(k)}
                      className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {keyword && results.length === 0 && (
              <div className="flex flex-col items-center pt-20 text-gray-400">
                <Mascot size={72} />
                <p className="mt-3 text-sm">这里空空如也，换个关键词试试？</p>
              </div>
            )}
            {results.map((p) => (
              <button
                key={p.id}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left"
                onClick={() => gotoPoi(p)}
              >
                <span className="text-xl">{p.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.sub} · {p.floor} · 距您 {fmtDist(dist(nodeById(p.node), position))}</p>
                </div>
                <span className="text-[#4A90D9] text-sm">导航 →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* POI 详情 */}
      {selectedPoi && (
        <PoiSheet
          poi={selectedPoi}
          onClose={() => setSelectedPoi(null)}
        />
      )}
    </div>
  )
}
