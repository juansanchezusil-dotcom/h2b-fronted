'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, ChevronDown } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'
import { errorMessage } from '@/lib/errors'

interface ErrorGroup {
  fingerprint: string
  kind: string
  message: string
  count: number
  users: number
  firstSeen: string
  lastSeen: string
  url: string | null
  stack: string | null
  userAgent: string | null
}

const KIND_LABEL: Record<string, string> = { error: 'Error', promesa: 'Promesa', pantalla: 'Pantalla' }

const ago = (iso: string) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`
}

// Errores que tuvo la app en los celulares de los miembros (últimos 7 días), agrupados por tipo de falla
export default function ErrorsPanel() {
  const [data, setData] = useState<{ total: number; groups: ErrorGroup[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiFetch('/api/admin/errores')
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'No se pudieron leer los errores.')
      setData(body)
    } catch (err) {
      setError(errorMessage(err, 'No se pudieron leer los errores.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Carga inicial de datos al abrir el panel; load() es la misma función del botón Actualizar
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (loading && !data) {
    return <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {data ? (data.total ? <><b>{data.total}</b> errores en {data.groups.length} grupos</> : 'Sin errores en los últimos 7 días. 🎉') : ''}
        </p>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 min-h-10 px-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      <ul className="space-y-2">
        {data?.groups.map((g) => (
          <li key={g.fingerprint} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              onClick={() => setOpen(open === g.fingerprint ? null : g.fingerprint)}
              aria-expanded={open === g.fingerprint}
              className="w-full text-left p-3 flex items-start gap-3"
            >
              <span className="shrink-0 min-w-10 text-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm font-black py-1">{g.count}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-xs text-slate-800 dark:text-slate-100 break-words">{g.message}</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {KIND_LABEL[g.kind] || g.kind} · {g.users} persona{g.users === 1 ? '' : 's'} · última {ago(g.lastSeen)} · {g.url || 'sin página'}
                </span>
              </span>
              <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open === g.fingerprint ? 'rotate-180' : ''}`} />
            </button>
            {open === g.fingerprint && (
              <div className="px-3 pb-3 space-y-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Primera vez {ago(g.firstSeen)} · {g.userAgent || 'navegador desconocido'}</p>
                {g.stack && (
                  <pre className="max-h-60 overflow-auto rounded-lg bg-slate-50 dark:bg-slate-800 p-2 text-[11px] leading-snug text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">{g.stack}</pre>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
