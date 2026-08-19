// 导航页：路径高亮 + 分步指引 + 语音播报 + 模拟行走 + 偏航重规划 + 沿途搜 + 全程概览
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import MapView from '@/components/MapView'
import Mascot from '@/components/Mascot'
import { ALONG_SEARCH, POIS, dist, fmtDist, fmtTime, nodeById } from '@/data/station'
import { planRoute } from '@/lib/route'
import { useApp } from '@/store'
import type { Poi, RouteMode } from '@/types'

const SPEED = 14 // 演示行走速度（米/秒，已加速）

export default function NavPage({ onExit }: { onExit: () => void }) {
  const { navSession, endNav, moveTo, position, settings, emergency } = useApp()
  const [mode, setMode] = useState<RouteMode>(navSession?.mode ?? 'shortest')
  const [route, setRoute] = useState(navSession?.route ?? null)
  const [progress, setProgress] = useState(0) // 已行走距离（米）
  const [voiceOn, setVoiceOn] = useState(settings.voice)
  const [overviewOpen, setOverviewOpen] = useState(false)
  const [alongOpen, setAlongOpen] = useState(false)
  const [arrived, setArrived] = useState(false)
  const spokenRef = useRef(0)
  const [paused, setPaused] = useState(false) // 演示：模拟切后台中断

  const dest = navSession?.dest

  // 路径上的累计里程与坐标插值
  const track = useMemo(() => {
    if (!route) return { points: [], cum: [0], total: 0 }
    const pts = route.nodeIds.map(nodeById)
    const cum = [0]
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]))
    return { points: pts, cum, total: cum[cum.length - 1] }
  }, [route])

  // 模拟行走 + 前台保持提示
  useEffect(() => {
    if (!route || arrived || paused) return
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + SPEED * 0.4, track.total)
        return next
      })
    }, 400)
    return () => clearInterval(timer)
  }, [route, arrived, paused, track.total])

  // 同步模拟位置
  useEffect(() => {
    if (!route || track.points.length < 2) return
    let i = 1
    while (i < track.cum.length - 1 && track.cum[i] < progress) i++
    const a = track.points[i - 1]
    const b = track.points[i]
    const segLen = track.cum[i] - track.cum[i - 1] || 1
    const t = Math.min(1, Math.max(0, (progress - track.cum[i - 1]) / segLen))
    moveTo({
      floor: t < 0.5 ? a.floor : b.floor,
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  // 到达判定（F-NAV-06：10 米内）
  useEffect(() => {
    if (!route || arrived) return
    if (track.total - progress <= 10 || progress >= track.total) {
      setArrived(true)
      speak(`到达目的地，${dest?.name ?? ''}`)
    }
  }, [progress, route, arrived, track.total, dest])

  // 语音播报：步骤推进时
  const currentStepIdx = useMemo(() => {
    if (!route) return 0
    let acc = 0
    for (let i = 0; i < route.steps.length; i++) {
      acc += route.steps[i].distance
      if (progress < acc + 10) return i
    }
    return route.steps.length - 1
  }, [route, progress])

  useEffect(() => {
    if (!route || !voiceOn || arrived) return
    if (spokenRef.current !== currentStepIdx) {
      spokenRef.current = currentStepIdx
      speak(route.steps[currentStepIdx]?.text ?? '')
    }
  }, [currentStepIdx, voiceOn, route, arrived])

  const speak = (text: string) => {
    if (!voiceOn || !text) return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'zh-CN'
      window.speechSynthesis.speak(u)
    } catch {
      /* 浏览器不支持时静默 */
    }
  }

  if (!navSession || !dest || !route) return null

  // 切换路径模式（F-NAV-03）
  const switchMode = (m: RouteMode) => {
    setMode(m)
    const startId = route.nodeIds[0]
    const r = planRoute(startId, dest.node, m)
    if (r) {
      setRoute(r)
      setProgress(0)
      spokenRef.current = -1
      toast.success(m === 'barrier_free' ? '已切换无障碍路径（避开楼梯扶梯）' : m === 'commercial' ? '已切换商业路径（途经商铺）' : '已切换最短路径')
    } else {
      toast.error('该模式下无可达路径')
    }
  }

  // 模拟偏航（F-NAV-05）
  const simulateDeviation = () => {
    const others = POIS.filter((p) => p.id !== dest.id && p.floor === position.floor)
    const jump = others[Math.floor(Math.random() * others.length)]
    const n = nodeById(jump.node)
    moveTo({ floor: n.floor, x: n.x, y: n.y })
    setTimeout(() => {
      const r = planRoute(jump.node, dest.node, mode)
      if (r) {
        setRoute(r)
        setProgress(0)
        spokenRef.current = -1
        toast.warning('检测到偏航（>5米），已重新规划路线')
        speak('您已偏离路线，正在重新规划')
      }
    }, 600)
  }

  // 沿途搜（F-NAV-07）
  const alongResults = (match: (p: Poi) => boolean) =>
    POIS.filter(match)
      .map((p) => ({ p, d: dist(nodeById(p.node), position) + (p.floor === position.floor ? 0 : 60) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)

  const changeDest = (poi: Poi) => {
    const cur = route.nodeIds.reduce((best, id) => {
      const n = nodeById(id)
      return dist(n, position) < dist(nodeById(best), position) ? id : best
    }, route.nodeIds[0])
    const r = planRoute(cur, poi.node, mode)
    if (r) {
      setRoute(r)
      setProgress(0)
      setArrived(false)
      spokenRef.current = -1
      setAlongOpen(false)
      toast.success(`已改道前往「${poi.name}」`)
      navSession.dest = poi
    }
  }

  const remain = Math.max(0, track.total - progress)
  const routeAds = POIS.filter((p) => p.ad && route.nodeIds.includes(p.node) && !emergency)

  return (
    <div className="relative h-full flex flex-col bg-[#F5F0E8]">
      {/* 顶部 */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3 bg-white/95 z-10">
        <button onClick={() => { endNav(false); onExit() }} className="text-gray-500">←</button>
        <div className="flex-1">
          <p className="text-xs text-gray-400">前往</p>
          <p className="font-bold text-gray-900 leading-tight">{dest.icon} {dest.name}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-[#EAF3FC] text-[#4A90D9]">
          {mode === 'shortest' ? '最短' : mode === 'barrier_free' ? '无障碍' : '商业'}
        </span>
      </div>

      {/* 地图 */}
      <div className="relative flex-1 overflow-hidden">
        <MapView floor={position.floor} position={position} path={route.nodeIds} destPoi={dest} />
        {/* 前台保持提示（F-NAV-09） */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full">
          ⚠ 请保持小程序在前台运行，锁屏将暂停导航
        </div>
      </div>

      {/* 指引面板 */}
      <div className="bg-white rounded-t-3xl shadow-2xl z-10 px-5 pt-4 pb-3">
        {arrived ? (
          <div className="flex items-center gap-4">
            <Mascot size={56} animate />
            <div className="flex-1">
              <p className="font-bold text-lg text-gray-900">到达目的地啦~ 🎉</p>
              <p className="text-xs text-gray-400">本次导航 {fmtDist(track.total)} · 用时 {fmtTime(Math.round(track.total / SPEED))}</p>
            </div>
            <button
              onClick={() => { endNav(true); onExit() }}
              className="px-5 py-2.5 rounded-full bg-[#5DBE8A] text-white font-bold text-sm"
            >
              完成
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-gray-900">{route.steps[currentStepIdx]?.text ?? '沿路径前行'}</p>
                <p className="text-xs text-gray-400 mt-0.5">剩余 {fmtDist(remain)} · {fmtTime(Math.round(remain / SPEED * 2))}</p>
              </div>
              <button onClick={() => setOverviewOpen(true)} className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                ≡ 全程概览
              </button>
            </div>
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4A90D9] to-[#3EC1D3] transition-all duration-500"
                style={{ width: `${Math.min(100, (progress / track.total) * 100)}%` }}
              />
            </div>

            {/* 沿途广告（F-ADS-02） */}
            {routeAds.length > 0 && (
              <div className="mt-3 rounded-xl bg-[#FFF7EC] border border-[#FFE1B8] px-3 py-2 flex items-center gap-2">
                <span>{routeAds[0].icon}</span>
                <p className="text-xs text-[#B25E00] flex-1">
                  途经：{routeAds[0].name}（{routeAds[0].ad!.coupon}）<span className="text-[10px] text-gray-400 ml-1">广告</span>
                </p>
              </div>
            )}

            {/* 模式切换 */}
            <div className="mt-3 flex gap-2">
              {(['shortest', 'barrier_free', 'commercial'] as RouteMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-1.5 rounded-full text-xs ${mode === m ? 'bg-[#4A90D9] text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {m === 'shortest' ? '⚡ 最短' : m === 'barrier_free' ? '♿ 无障碍' : '🛒 商业'}
                </button>
              ))}
            </div>

            {/* 操作栏 */}
            <div className="mt-3 grid grid-cols-4 gap-2">
              <button
                onClick={() => { setVoiceOn(!voiceOn); if (voiceOn) window.speechSynthesis.cancel() }}
                className={`py-2 rounded-2xl text-xs flex flex-col items-center gap-0.5 ${voiceOn ? 'bg-[#EAF3FC] text-[#4A90D9]' : 'bg-gray-100 text-gray-400'}`}
              >
                <span className="text-base">{voiceOn ? '🔊' : '🔇'}</span>语音
              </button>
              <button onClick={() => setAlongOpen(true)} className="py-2 rounded-2xl bg-gray-100 text-gray-600 text-xs flex flex-col items-center gap-0.5">
                <span className="text-base">📍</span>沿途搜
              </button>
              <button onClick={simulateDeviation} className="py-2 rounded-2xl bg-gray-100 text-gray-600 text-xs flex flex-col items-center gap-0.5">
                <span className="text-base">↪️</span>模拟偏航
              </button>
              <button onClick={() => { endNav(false); onExit() }} className="py-2 rounded-2xl bg-gray-100 text-gray-600 text-xs flex flex-col items-center gap-0.5">
                <span className="text-base">🏁</span>结束
              </button>
            </div>

            {/* 演示：模拟切后台 */}
            <button
              onClick={() => {
                setPaused(true)
                toast.warning('小程序已进入后台，定位与播报已暂停')
                setTimeout(() => {
                  setPaused(false)
                  toast.success('已返回前台，导航无感续接')
                  speak('已恢复导航')
                }, 2500)
              }}
              className="mt-2 w-full text-[10px] text-gray-300 underline"
            >
              演示：模拟切后台 2.5 秒（断点续接）
            </button>
          </>
        )}
      </div>

      {/* 全程概览抽屉（F-NAV-10） */}
      {overviewOpen && (
        <div className="absolute inset-0 z-40 flex items-end" onClick={() => setOverviewOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-h-[70%] bg-white rounded-t-3xl p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">全程概览</h3>
            <p className="text-xs text-gray-400 mb-4">全程 {fmtDist(track.total)} · 预计 {fmtTime(route.seconds)}{route.crossFloor ? ' · 需跨楼层' : ''}</p>
            {route.steps.map((s, i) => (
              <div key={i} className="flex gap-3 pb-4">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === currentStepIdx ? 'bg-[#4A90D9] text-white' : i < currentStepIdx ? 'bg-[#5DBE8A] text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {i < currentStepIdx ? '✓' : i + 1}
                  </div>
                  {i < route.steps.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pt-1">
                  <p className={`text-sm ${i === currentStepIdx ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{s.text}</p>
                  {s.distance > 0 && <p className="text-xs text-gray-400">{fmtDist(s.distance)}</p>}
                </div>
              </div>
            ))}
            <div className="flex gap-3 items-center">
              <div className="w-7 h-7 rounded-full bg-[#5DBE8A] flex items-center justify-center text-xs">🏁</div>
              <p className="text-sm font-semibold text-gray-900">到达 {dest.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* 沿途搜弹层 */}
      {alongOpen && (
        <div className="absolute inset-0 z-40 flex items-end" onClick={() => setAlongOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full bg-white rounded-t-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3">沿途搜 · 改道前往</h3>
            {ALONG_SEARCH.map((a) => (
              <div key={a.key} className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">{a.icon} {a.name}</p>
                <div className="flex gap-2">
                  {alongResults(a.match).map(({ p, d }) => (
                    <button
                      key={p.id}
                      onClick={() => changeDest(p)}
                      className="flex-1 bg-[#F7F8FA] rounded-xl px-3 py-2 text-left"
                    >
                      <p className="text-xs font-semibold text-gray-800">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.floor} · {fmtDist(d)}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
