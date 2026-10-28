'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import { getPushState, enablePush, disablePush, type PushState } from '@/lib/push'

const DISMISS_KEY = 'jta:pushDismissed'

export function usePush() {
  const [state, setState] = useState<PushState>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getPushState()
      .then((s) => alive && setState(s))
      .catch(() => alive && setState('unsupported'))
    return () => {
      alive = false
    }
  }, [])

  const run = useCallback(async (fn: () => Promise<PushState>) => {
    setBusy(true)
    setError(null)
    try {
      setState(await fn())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos activar los avisos.')
    } finally {
      setBusy(false)
    }
  }, [])

  return { state, busy, error, enable: () => run(enablePush), disable: () => run(disablePush) }
}

// Tarjeta del Inicio que invita a activar los avisos. Sale solo si se pueden activar y nadie la cerró.
export function PushPromptCard() {
  const { state, busy, error, enable } = usePush()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    // localStorage solo existe en el navegador
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  if (dismissed || state !== 'off') return null

  const close = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="relative rounded-2xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 p-4 pr-11">
      <button
        onClick={close}
        aria-label="Cerrar"
        className="absolute top-1.5 right-1.5 w-10 h-10 flex items-center justify-center text-slate-400"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-900 dark:text-white">Te avisamos al celular</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            Cuando salgan ofertas nuevas de tu puesto y cuando toque hacer seguimiento. Máximo uno de cada uno al día.
          </p>
          {error && <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">{error}</p>}
          <button
            onClick={enable}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-60 text-white text-sm font-bold"
          >
            <Bell className="w-4 h-4" /> {busy ? 'Activando…' : 'Activar avisos'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Opción del menú de cuenta para prender o apagar los avisos en este dispositivo
export function PushMenuItem() {
  const { state, busy, error, enable, disable } = usePush()
  if (state === 'loading' || state === 'unsupported' || state === 'unavailable') return null

  const row = 'w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2'
  if (state === 'needs-install') {
    return (
      <p className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex gap-2">
        <Bell className="w-4 h-4 shrink-0 text-slate-400" />
        Para recibir avisos en iPhone, instala la app en tu pantalla de inicio.
      </p>
    )
  }
  if (state === 'denied') {
    return (
      <p className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex gap-2">
        <BellOff className="w-4 h-4 shrink-0 text-slate-400" />
        Bloqueaste los avisos. Actívalos en los ajustes del navegador para este sitio.
      </p>
    )
  }
  return (
    <>
      <button onClick={state === 'on' ? disable : enable} disabled={busy} className={row}>
        {state === 'on' ? <BellOff className="w-4 h-4 text-slate-400" /> : <Bell className="w-4 h-4 text-slate-400" />}
        {busy ? 'Un momento…' : state === 'on' ? 'Apagar avisos' : 'Activar avisos'}
      </button>
      {error && <p className="px-4 pb-2 text-[11px] text-rose-600 dark:text-rose-400">{error}</p>}
    </>
  )
}
