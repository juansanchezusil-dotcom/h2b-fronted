'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const TRIGGER = 80 // px que hay que jalar para recargar
const MAX = 120

// "Jalar para actualizar" en la app instalada: a pantalla completa no hay barra del navegador para recargar.
// En el navegador normal no se activa (ya tiene el suyo).
export default function PullToRefresh() {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)
  const pullRef = useRef(0)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (!standalone) return

    const onStart = (e: TouchEvent) => {
      start.current = null
      if (window.scrollY > 0 || e.touches.length !== 1) return
      // No dentro de ventanas, paneles ni campos: ahí jalar hacia abajo es desplazarse
      const t = e.target as HTMLElement | null
      if (t?.closest('[role="dialog"], .fixed, input, textarea, select')) return
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onMove = (e: TouchEvent) => {
      if (!start.current) return
      const dy = e.touches[0].clientY - start.current.y
      const dx = Math.abs(e.touches[0].clientX - start.current.x)
      if (dy <= 0 || dx > dy || window.scrollY > 0) {
        pullRef.current = 0
        setPull(0)
        return
      }
      // Resistencia: cuesta más mientras más se jala
      const value = Math.min(MAX, dy * 0.5)
      pullRef.current = value
      setPull(value)
    }
    const onEnd = () => {
      if (!start.current) return
      start.current = null
      if (pullRef.current >= TRIGGER) {
        setRefreshing(true)
        setPull(TRIGGER)
        window.location.reload()
        return
      }
      pullRef.current = 0
      setPull(0)
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  if (pull === 0 && !refreshing) return null
  const ready = pull >= TRIGGER
  return (
    <div
      className="fixed left-1/2 z-[60] -translate-x-1/2 pointer-events-none"
      style={{ top: `calc(env(safe-area-inset-top) + ${pull - 40}px)` }}
      role="status"
      aria-live="polite"
    >
      <div
        className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          ready ? 'bg-[#f5c518] text-[#0B2545]' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300'
        }`}
      >
        <RefreshCw
          className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
          style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }}
        />
      </div>
      <span className="sr-only">{refreshing ? 'Actualizando…' : ready ? 'Suelta para actualizar' : 'Jala para actualizar'}</span>
    </div>
  )
}
