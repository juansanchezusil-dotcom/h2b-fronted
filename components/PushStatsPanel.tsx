'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'
import { errorMessage } from '@/lib/errors'

interface PushStats {
  dispositivos: number
  personas: number
  porTipo: { tipo: string; enviados: number; abiertos: number; tasa: number | null }[]
}

const LABEL: Record<string, string> = { ofertas: 'Ofertas nuevas del puesto', seguimientos: 'Seguimientos pendientes' }

// Avisos push de los últimos 30 días: quién los tiene activos, cuántos se enviaron y cuántos se abrieron
export default function PushStatsPanel() {
  const [data, setData] = useState<PushStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiFetch('/api/admin/push')
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'No se pudieron leer las métricas.')
      setData(body)
    } catch (err) {
      setError(errorMessage(err, 'No se pudieron leer las métricas.'))
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
          {data && <><b>{data.personas}</b> persona{data.personas === 1 ? '' : 's'} con avisos activos ({data.dispositivos} dispositivo{data.dispositivos === 1 ? '' : 's'})</>}
        </p>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 min-h-10 px-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data?.porTipo.map((t) => (
          <div key={t.tipo} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{LABEL[t.tipo] || t.tipo}</p>
            <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">
              <b className="text-lg">{t.enviados}</b> enviados · <b className="text-lg">{t.abiertos}</b> abiertos
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.tasa === null ? 'Sin envíos todavía' : `${t.tasa}% los abrió`}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
