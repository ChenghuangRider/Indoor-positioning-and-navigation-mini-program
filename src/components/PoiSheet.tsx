// POI 详情底部弹层：详情 + 导航 + 收藏 + 分享 + 优惠券
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { fmtDist, fmtTime, nodeById, walkSeconds } from '@/data/station'
import { planRoute } from '@/lib/route'
import { useApp } from '@/store'
import type { Poi } from '@/types'

export default function PoiSheet({ poi, onClose }: { poi: Poi; onClose: () => void }) {
  const { position, nearestNode, favorites, toggleFavorite, startNav, settings, setEmergency } = useApp()
  const [couponTaken, setCouponTaken] = useState(false)

  const distMeters = useMemo(() => {
    const n = nodeById(poi.node)
    const sameFloor = n.floor === position.floor
    const d = Math.hypot(n.x - position.x, n.y - position.y)
    return { d, sameFloor }
  }, [poi, position])

  const isFav = favorites.includes(poi.id)
  const floorName = poi.floor === 'F2' ? '2F' : poi.floor === 'F1' ? '1F' : 'B1'

  const handleNav = () => {
    const route = planRoute(nearestNode, poi.node, settings.routeMode)
    if (!route) {
      toast.error('该区域暂不可达，已为您推荐最近的替代目标')
      return
    }
    setEmergency(false)
    startNav(poi, route, settings.routeMode)
    onClose()
  }

  const handleShare = async () => {
    const text = `【泉城智行】我在济南西站${floorName}层「${poi.name}」附近，点击导航来找我（24小时内有效）`
    try {
      await navigator.clipboard.writeText(text)
      toast.success('位置卡片已复制，可粘贴分享给微信好友（24小时有效）')
    } catch {
      toast.success('位置卡片已生成（24小时有效）')
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full bg-white rounded-t-3xl p-5 pb-7 animate-[slideUp_.25s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#EAF3FC] flex items-center justify-center text-3xl">
            {poi.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">{poi.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#EAF3FC] text-[#4A90D9]">{floorName}</span>
              {poi.open === false && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">已歇业</span>}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {poi.sub} · {poi.accessible ? '无障碍可达 ♿' : '需经楼梯'}
              {poi.hours ? ` · 营业 ${poi.hours}` : ''}
            </p>
            <p className="text-sm text-gray-500">
              距您 {fmtDist(distMeters.d)}
              {distMeters.sameFloor
                ? ` · 步行 ${fmtTime(walkSeconds(distMeters.d))}`
                : ` · 跨楼层（含电梯约1分钟）`}
            </p>
          </div>
          <button
            onClick={() => {
              toggleFavorite(poi.id)
              toast.success(isFav ? '已取消收藏' : '已收藏，可在"我的"中查看')
            }}
            className="text-2xl"
            aria-label="收藏"
          >
            {isFav ? '⭐' : '☆'}
          </button>
        </div>

        {poi.ad && (
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#FFF4E0] to-[#FFE9D0] p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#B25E00]">🎟️ {poi.ad.title}</p>
              <p className="text-xs text-[#B25E00]/80">{poi.ad.desc} · <span className="underline decoration-dotted">广告</span></p>
            </div>
            <button
              onClick={() => {
                setCouponTaken(true)
                toast.success('优惠券已放入卡包')
              }}
              disabled={couponTaken}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold ${couponTaken ? 'bg-gray-200 text-gray-400' : 'bg-[#FF7A00] text-white'}`}
            >
              {couponTaken ? '已领取' : '领取'}
            </button>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-full border border-[#4A90D9] text-[#4A90D9] font-semibold text-sm"
          >
            📤 分享位置
          </button>
          <button
            onClick={handleNav}
            className="flex-[2] py-3 rounded-full bg-[#4A90D9] text-white font-semibold text-sm shadow-lg shadow-[#4A90D9]/30"
          >
            🧭 到这去
          </button>
        </div>
      </div>
    </div>
  )
}
