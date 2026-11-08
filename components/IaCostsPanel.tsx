'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'

interface IaCostos {
  days: number
  totalCostUsd: number
  totalCalls: number
  avgCostPerCallUsd: number
  byModel: Record<string, { calls: number; inputTokens: number; outputTokens: number; costUsd: number }>
  rows: { day: string; model: string; calls: number; costUsd: number }[]
}

const usd = (n: number) => `$${n < 1 ? n.toFixed(3) : n.toFixed(2)}`
const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4'

// Gasto estimado de los asistentes de IA (CV, carta, correo, entrevista): por modelo y por día
export default function IaCostsPanel() {
  const [data, setData] = useState<IaCostos | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await aiFetch('/api/admin/ia-costos?dias=30')
      const body = await res.json().catch(() => ({}))
      if (cancelled) return
      if (!res.ok) setError(body.error || 'No se pudo cargar el costo de IA.')
      else setData(body)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Últimos {data.days} días. Es una estimación con las tarifas públicas; el saldo real está en console.anthropic.com. Las llamadas de respaldo a Gemini no tienen costo medido.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className={card}>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{usd(data.totalCostUsd)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total estimado</p>
        </div>
        <div className={card}>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{data.totalCalls}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Llamadas</p>
        </div>
        <div className={card}>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{usd(data.avgCostPerCallUsd)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Promedio por llamada</p>
        </div>
      </div>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
              <th className="pb-2 font-semibold">Modelo</th>
              <th className="pb-2 font-semibold text-right">Llamadas</th>
              <th className="pb-2 font-semibold text-right">Tokens in</th>
              <th className="pb-2 font-semibold text-right">Tokens out</th>
              <th className="pb-2 font-semibold text-right">Costo</th>
            </tr>
          </thead>
          <tbody className="text-slate-800 dark:text-slate-100 tabular-nums">
            {Object.entries(data.byModel).map(([model, m]) => (
              <tr key={model} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-1.5 font-semibold">{model}</td>
                <td className="py-1.5 text-right">{m.calls}</td>
                <td className="py-1.5 text-right">{m.inputTokens.toLocaleString('es')}</td>
                <td className="py-1.5 text-right">{m.outputTokens.toLocaleString('es')}</td>
                <td className="py-1.5 text-right font-bold">{usd(m.costUsd)}</td>
              </tr>
            ))}
            {Object.keys(data.byModel).length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-slate-500 dark:text-slate-400">
                  Aún no hay llamadas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
