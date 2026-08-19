// 个人中心：账号、历史、收藏、偏好、隐私、反馈、演示工具
import { useState } from 'react'
import { toast } from 'sonner'
import Mascot from '@/components/Mascot'
import { poiById } from '@/data/station'
import { useApp } from '@/store'
import type { RouteMode } from '@/types'

export default function MePage() {
  const {
    settings, setSettings, favorites, history, emergency, setEmergency,
    loggedIn, setLoggedIn, resetDemo,
  } = useApp()
  const [feedback, setFeedback] = useState('')

  const MODE_LABEL: Record<RouteMode, string> = {
    shortest: '⚡ 最短路径',
    barrier_free: '♿ 无障碍路径',
    commercial: '🛒 商业路径',
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F7F8FA] pb-6">
      {/* 账号卡片（F-ME-06） */}
      <div className="bg-gradient-to-br from-[#4A90D9] to-[#3EC1D3] px-5 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <Mascot size={44} />
          </div>
          <div className="flex-1">
            {loggedIn ? (
              <>
                <p className="text-white font-bold text-lg">泉水旅人_0826</p>
                <p className="text-white/70 text-xs">微信授权登录 · openid 体系</p>
              </>
            ) : (
              <>
                <p className="text-white font-bold text-lg">游客模式</p>
                <p className="text-white/70 text-xs">登录后可同步历史与收藏</p>
              </>
            )}
          </div>
          <button
            onClick={() => {
              setLoggedIn(!loggedIn)
              toast.success(loggedIn ? '已退出登录' : '微信授权登录成功')
            }}
            className="px-4 py-2 rounded-full bg-white text-[#4A90D9] text-xs font-bold"
          >
            {loggedIn ? '退出' : '微信登录'}
          </button>
        </div>
      </div>

      <div className="px-3 -mt-4 space-y-3">
        {/* 历史（F-ME-01） */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2">🕘 导航历史</h3>
          {history.length === 0 ? (
            <p className="text-xs text-gray-400">暂无记录，完成一次导航后自动记录</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {history.map((id) => {
                const p = poiById(id)
                return p ? (
                  <span key={id} className="px-3 py-1.5 bg-[#F7F8FA] rounded-full text-xs text-gray-600">
                    {p.icon} {p.name}
                  </span>
                ) : null
              })}
            </div>
          )}
        </section>

        {/* 收藏（F-ME-05） */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2">⭐ 收藏的地点（{favorites.length}/20）</h3>
          {favorites.length === 0 ? (
            <p className="text-xs text-gray-400">在地点详情页点击 ☆ 收藏常用目的地</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {favorites.map((id) => {
                const p = poiById(id)
                return p ? (
                  <span key={id} className="px-3 py-1.5 bg-[#FFF8E8] rounded-full text-xs text-gray-700">
                    {p.icon} {p.name}
                  </span>
                ) : null
              })}
            </div>
          )}
        </section>

        {/* 偏好设置（F-ME-02） */}
        <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-900">⚙️ 偏好设置</h3>
          <div>
            <p className="text-xs text-gray-400 mb-1.5">默认路径模式</p>
            <div className="flex gap-2">
              {(Object.keys(MODE_LABEL) as RouteMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSettings({ routeMode: m })}
                  className={`flex-1 py-2 rounded-xl text-xs ${settings.routeMode === m ? 'bg-[#4A90D9] text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
          <SettingRow label="语音播报" desc="转弯前 10 米自动播报" value={settings.voice} onChange={(v) => setSettings({ voice: v })} />
          <SettingRow
            label="高精度定位"
            desc={settings.locMode === 'high' ? '蓝牙+WiFi（精度1-3米）' : '省电模式：仅WiFi（精度5-8米）'}
            value={settings.locMode === 'high'}
            onChange={(v) => setSettings({ locMode: v ? 'high' : 'save' })}
          />
        </section>

        {/* 隐私管理（F-ME-03） */}
        <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-900">🔒 隐私管理</h3>
          <SettingRow
            label="个性化推荐"
            desc="关闭后仅展示站内公共服务信息（24小时内生效）"
            value={settings.personalized}
            onChange={(v) => setSettings({ personalized: v })}
          />
          <button
            onClick={() => toast.success('位置历史已清除（位置数据仅保留7天且脱敏存储）')}
            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold"
          >
            🗑️ 一键清除位置历史
          </button>
          <p className="text-[10px] text-gray-300">权限状态：定位 · 已授权（仅使用期间）｜蓝牙 · 已授权</p>
        </section>

        {/* 意见反馈（F-ME-04） */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2">💬 意见反馈</h3>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="告诉我们您遇到的问题或建议…"
            className="w-full h-20 bg-gray-50 rounded-xl p-3 text-sm outline-none resize-none"
          />
          <button
            onClick={() => {
              if (!feedback.trim()) {
                toast.info('请先填写反馈内容')
                return
              }
              setFeedback('')
              toast.success('反馈已提交，我们会尽快处理')
            }}
            className="mt-2 w-full py-2.5 rounded-xl bg-[#4A90D9] text-white text-xs font-bold"
          >
            提交反馈
          </button>
        </section>

        {/* 演示工具 */}
        <section className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-bold text-gray-900">🧪 演示工具</h3>
          <button
            onClick={() => {
              setEmergency(!emergency)
              toast[emergency ? 'info' : 'warning'](emergency ? '已退出应急疏散模式' : '站方已触发应急疏散模式：请沿指示前往最近安全出口')
            }}
            className={`w-full py-2.5 rounded-xl text-xs font-bold ${emergency ? 'bg-[#F5222D] text-white' : 'bg-[#FFF1F0] text-[#F5222D]'}`}
          >
            🚨 {emergency ? '退出应急疏散模式' : '演示：触发应急疏散模式（F-EM-01）'}
          </button>
          <button onClick={resetDemo} className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-semibold">
            🔄 重置演示数据
          </button>
        </section>

        <p className="text-center text-[10px] text-gray-300 pt-1">泉城智行 Demo · 泉心泉意，畅行泉城</p>
      </div>
    </div>
  )
}

function SettingRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-800">{label}</p>
        <p className="text-[10px] text-gray-400">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full relative transition-colors ${value ? 'bg-[#4A90D9]' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
