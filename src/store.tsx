// 全局状态：模拟定位、设置、收藏、历史、广告频控、应急模式
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { POIS, nodeById } from '@/data/station'
import { nearestNodeId } from '@/lib/route'
import type { FloorId, NavSession, Poi, RouteMode, SimPosition } from '@/types'

export interface Settings {
  routeMode: RouteMode
  voice: boolean
  locMode: 'high' | 'save'
  personalized: boolean
}

interface AppState {
  position: SimPosition
  moveTo: (pos: SimPosition) => void
  /** 当前位置吸附到的最近路网节点 */
  nearestNode: string
  settings: Settings
  setSettings: (s: Partial<Settings>) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  history: string[]
  navSession: NavSession | null
  startNav: (poi: Poi, route: NavSession['route'], mode: RouteMode) => void
  endNav: (arrived: boolean) => void
  emergency: boolean
  setEmergency: (v: boolean) => void
  /** 已触达广告的商铺（频控：每铺一次） */
  adExposed: string[]
  markAdExposed: (id: string) => void
  loggedIn: boolean
  setLoggedIn: (v: boolean) => void
  resetDemo: () => void
}

const Ctx = createContext<AppState | null>(null)

const DEFAULT_POS: SimPosition = { floor: 'F1', x: 40, y: 240 } // 进站口

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<SimPosition>(DEFAULT_POS)
  const [settings, setSettingsState] = useState<Settings>(() =>
    load('qc_settings', { routeMode: 'shortest', voice: true, locMode: 'high', personalized: true }),
  )
  const [favorites, setFavorites] = useState<string[]>(() => load('qc_favs', []))
  const [history, setHistory] = useState<string[]>(() => load('qc_history', []))
  const [navSession, setNavSession] = useState<NavSession | null>(null)
  const [emergency, setEmergency] = useState(false)
  const [adExposed, setAdExposed] = useState<string[]>([])
  const [loggedIn, setLoggedIn] = useState(false)

  const moveTo = useCallback((pos: SimPosition) => setPosition(pos), [])

  const nearestNode = useMemo(
    () => nearestNodeId(position.x, position.y, position.floor as FloorId),
    [position],
  )

  const setSettings = useCallback((s: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...s }
      localStorage.setItem('qc_settings', JSON.stringify(next))
      return next
    })
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev.slice(-19), id]
      localStorage.setItem('qc_favs', JSON.stringify(next))
      return next
    })
  }, [])

  const startNav = useCallback((poi: Poi, route: NavSession['route'], mode: RouteMode) => {
    setNavSession({ dest: poi, mode, route })
  }, [])

  const endNav = useCallback((arrived: boolean) => {
    setNavSession((prev) => {
      if (prev && arrived) {
        setHistory((h) => {
          const next = [prev.dest.id, ...h.filter((x) => x !== prev.dest.id)].slice(0, 10)
          localStorage.setItem('qc_history', JSON.stringify(next))
          return next
        })
      }
      return null
    })
    if (!arrived) toast.info('已结束导航')
  }, [])

  const markAdExposed = useCallback((id: string) => {
    setAdExposed((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const resetDemo = useCallback(() => {
    localStorage.clear()
    setPosition(DEFAULT_POS)
    setFavorites([])
    setHistory([])
    setAdExposed([])
    setNavSession(null)
    setEmergency(false)
    setSettingsState({ routeMode: 'shortest', voice: true, locMode: 'high', personalized: true })
    toast.success('演示数据已重置')
  }, [])

  const value = useMemo<AppState>(
    () => ({
      position,
      moveTo,
      nearestNode,
      settings,
      setSettings,
      favorites,
      toggleFavorite,
      history,
      navSession,
      startNav,
      endNav,
      emergency,
      setEmergency,
      adExposed,
      markAdExposed,
      loggedIn,
      setLoggedIn,
      resetDemo,
    }),
    [position, moveTo, nearestNode, settings, setSettings, favorites, toggleFavorite, history, navSession, startNav, endNav, emergency, adExposed, markAdExposed, loggedIn, resetDemo],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used within AppProvider')
  return v
}

// 当前位置附近的广告商铺（地理围栏 20 米）
export function useGeofenceAd(): Poi | null {
  const { position, adExposed, settings, emergency } = useApp()
  return useMemo(() => {
    if (!settings.personalized || emergency) return null
    for (const p of POIS) {
      if (!p.ad || adExposed.includes(p.id)) continue
      if (p.floor !== position.floor) continue
      const n = nodeById(p.node)
      if (Math.hypot(n.x - position.x, n.y - position.y) <= 20) return p
    }
    return null
  }, [position, adExposed, settings.personalized, emergency])
}
