import { StrictMode } from 'react'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import Mascot from '@/components/Mascot'
import FindPage from '@/pages/FindPage'
import HomePage from '@/pages/HomePage'
import MePage from '@/pages/MePage'
import NavPage from '@/pages/NavPage'
import { AppProvider, useApp } from '@/store'

type Tab = 'home' | 'find' | 'me'

function Shell() {
  const { navSession } = useApp()
  const [tab, setTab] = useState<Tab>('home')
  const [navOpen, setNavOpen] = useState(false)

  // 发起导航时打开导航页
  useEffect(() => {
    if (navSession) setNavOpen(true)
  }, [navSession])

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      {/* 状态栏 */}
      <div className="h-7 flex items-center justify-between px-6 text-[11px] font-semibold text-gray-800 shrink-0">
        <span>9:41</span>
        <span className="flex gap-1 items-center">📶 🔋</span>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {navOpen && navSession ? (
          <NavPage onExit={() => setNavOpen(false)} />
        ) : tab === 'home' ? (
          <HomePage onStartNav={() => setNavOpen(true)} />
        ) : tab === 'find' ? (
          <FindPage />
        ) : (
          <MePage />
        )}
      </div>

      {/* Tab Bar */}
      {!navOpen && (
        <div className="grid grid-cols-3 border-t border-gray-100 bg-white shrink-0">
          {(
            [
              { key: 'home', icon: '🗺️', name: '首页地图' },
              { key: 'find', icon: '🔍', name: '目标速查' },
              { key: 'me', icon: '👤', name: '我的' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-2 flex flex-col items-center gap-0.5 ${tab === t.key ? 'text-[#4A90D9]' : 'text-gray-400'}`}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-[10px]">{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#EAF3FC] to-white">
      <Mascot size={110} animate />
      <h1 className="mt-4 text-2xl font-black text-[#4A90D9] tracking-wide">泉城智行</h1>
      <p className="mt-1 text-sm text-gray-400">泉心泉意，畅行泉城</p>
      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-[#3EC1D3] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [splash, setSplash] = useState(true)
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#1B3A5C] flex items-center justify-center p-0 sm:p-6">
        {/* 手机外框 */}
        <div className="w-full sm:w-[400px] h-[100dvh] sm:h-[800px] sm:rounded-[40px] sm:border-[10px] sm:border-gray-900 sm:shadow-2xl overflow-hidden bg-white relative">
          {splash ? <Splash onDone={() => setSplash(false)} /> : <Shell />}
          <Toaster position="top-center" toastOptions={{ style: { fontSize: 13 } }} />
        </div>
      </div>
    </AppProvider>
  )
}
