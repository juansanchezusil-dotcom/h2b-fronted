'use client'

import { useEffect, useRef, useState } from 'react'
import { Home, Briefcase, Send, Sparkles, LayoutGrid, Building2, ShieldCheck, Compass, type LucideIcon } from 'lucide-react'

type Item = { tab: string; label: string; icon: LucideIcon }

// Las 4 secciones de uso diario van a mano del pulgar; el resto, en "Más"
const MAIN: Item[] = [
  { tab: 'dashboard', label: 'Inicio', icon: Home },
  { tab: 'jobs', label: 'Ofertas', icon: Briefcase },
  { tab: 'crm', label: 'Mi CRM', icon: Send },
  { tab: 'ai', label: 'IA', icon: Sparkles },
]
const MORE: Item[] = [
  { tab: 'employers', label: 'Empresas USCIS', icon: Building2 },
  { tab: 'agencies', label: 'Agencias DOL', icon: ShieldCheck },
  { tab: 'checklist', label: 'Mi Mapa', icon: Compass },
]

interface MobileTabBarProps {
  activeTab: string
  onChange: (tab: string) => void
  // Número rojo sobre el ícono (p. ej. seguimientos pendientes en Mi CRM); 0 lo oculta
  badges?: Partial<Record<string, number>>
}

export default function MobileTabBar({ activeTab, onChange, badges = {} }: MobileTabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const moreActive = MORE.some((i) => i.tab === activeTab)

  // Cierra "Más" al tocar fuera o con Escape
  useEffect(() => {
    if (!moreOpen) return
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMoreOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  const go = (tab: string) => {
    setMoreOpen(false)
    onChange(tab)
  }

  const itemClass = (active: boolean) =>
    `flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 min-h-14 text-[11px] font-semibold transition-colors ${
      active ? 'text-[#1a3a8f] dark:text-[#f5c518]' : 'text-slate-500 dark:text-slate-400'
    }`

  return (
    <nav
      ref={ref}
      aria-label="Secciones"
      className="sm:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]"
    >
      {moreOpen && (
        <div className="absolute right-2 bottom-full mb-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5">
          {MORE.map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => go(tab)}
              aria-current={activeTab === tab ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-4 min-h-11 text-sm text-left ${
                activeTab === tab
                  ? 'font-semibold text-[#1a3a8f] dark:text-[#f5c518] bg-slate-50 dark:bg-slate-800'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-stretch">
        {MAIN.map(({ tab, label, icon: Icon }) => {
          const active = activeTab === tab
          const badge = badges[tab] ?? 0
          return (
            <button key={tab} onClick={() => go(tab)} aria-current={active ? 'page' : undefined} className={itemClass(active)}>
              <span className={`relative flex items-center justify-center w-12 h-7 rounded-full ${active ? 'bg-[#f5c518]/25' : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {badge > 0 && (
                  <span className="absolute -top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[11px] font-bold leading-[18px] text-center ring-2 ring-white dark:ring-slate-900">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className="truncate max-w-full">
                {label}
                {badge > 0 && <span className="sr-only">, {badge} pendientes</span>}
              </span>
            </button>
          )
        })}
        <button
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          aria-haspopup="true"
          className={itemClass(moreActive || moreOpen)}
        >
          <span className={`flex items-center justify-center w-12 h-7 rounded-full ${moreActive ? 'bg-[#f5c518]/25' : ''}`}>
            <LayoutGrid className="w-5 h-5" strokeWidth={moreActive ? 2.5 : 2} />
          </span>
          <span className="truncate max-w-full">Más</span>
        </button>
      </div>
    </nav>
  )
}
