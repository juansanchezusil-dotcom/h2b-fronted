'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Users, Activity, Clock, AlertTriangle, Bell, Sparkles, MapPin } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'

interface Resultados {
  muestra: number
  embudo: { clave: string; etiqueta: string; n: number }[]
  activos7: number
  vigentes: number
  porVencer: number
  vencidos: number
  mapa: { total: number }
}
interface PushStats {
  personas: number
  porTipo: { tipo: string; enviados: number; abiertos: number; tasa: number | null }[]
}
interface IaCostos {
  totalCostUsd: number
  totalCalls: number
  avgCostPerCallUsd: number
  byModel: Record<string, { calls: number; costUsd: number }>
  rows: { day: string; costUsd: number; calls: number }[]
}
interface Snapshot {
  resultados: Resultados | null
  errores: number | null
  push: PushStats | null
  ia: IaCostos | null
}

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4'
const usd = (n: number) => `$${n < 1 ? n.toFixed(3) : n.toFixed(2)}`

async function get<T>(url: string): Promise<T | null> {
  try {
    const res = await aiFetch(url)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'neutral',
  onClick,
}: {
  icon: typeof Users
  label: string
  value: string
  hint?: string
  tone?: 'neutral' | 'good' | 'warn' | 'bad'
  onClick?: () => void
}) {
  const tones = {
    neutral: 'text-[#0B4079] bg-[#0B4079]/10 dark:text-[#C89B3C] dark:bg-[#C89B3C]/10',
    good: 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10',
    warn: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10',
    bad: 'text-rose-700 bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10',
  }
  const body = (
    <>
      <span className={`inline-flex w-9 h-9 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="w-4.5 h-4.5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p>
      {hint && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>}
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={`${card} text-left hover:border-[#C89B3C] transition-colors`}>
      {body}
    </button>
  ) : (
    <div className={card}>{body}</div>
  )
}

// Últimos 30 días de costo de IA, rellenando los días sin uso para que la barra refleje el tiempo real
function dailyCost(rows: IaCostos['rows']) {
  const byDay = new Map<string, number>()
  for (const r of rows) byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.costUsd)
  const out: { day: string; cost: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
    out.push({ day, cost: byDay.get(day) ?? 0 })
  }
  return out
}

// Resumen de todo lo que se maneja desde el panel. Cada tarjeta lleva a su sección.
export default function OverviewPanel({ onGo }: { onGo: (id: string) => void }) {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [resultados, errores, push, ia] = await Promise.all([
      get<Resultados>('/api/admin/resultados'),
      get<{ total: number }>('/api/admin/errores'),
      get<PushStats>('/api/admin/push'),
      get<IaCostos>('/api/admin/ia-costos?dias=30'),
    ])
    setSnap({ resultados, errores: errores ? errores.total : null, push, ia })
    setLoading(false)
  }, [])

  useEffect(() => {
    // Carga inicial al abrir el panel; load() es la misma función del botón Actualizar
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (!snap) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-10">
        <Loader2 className="w-4 h-4 animate-spin" /> Armando el resumen...
      </div>
    )
  }

  const { resultados: r, errores, push, ia } = snap
  const pushEnviados = push?.porTipo.reduce((s, t) => s + t.enviados, 0) ?? 0
  const pushAbiertos = push?.porTipo.reduce((s, t) => s + t.abiertos, 0) ?? 0
  const costDays = ia ? dailyCost(ia.rows) : []
  const maxCost = Math.max(0.0001, ...costDays.map((d) => d.cost))
  const embudoMax = Math.max(1, ...(r?.embudo.map((e) => e.n) ?? [1]))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Resumen</h1>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#0B4079] dark:text-[#C89B3C] hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Users} label="Miembros vigentes" value={r ? String(r.vigentes) : '—'} hint={r ? `${r.vencidos} vencidos` : undefined} onClick={() => onGo('membresias')} />
        <Kpi icon={Activity} label="Activos esta semana" value={r ? String(r.activos7) : '—'} tone="good" onClick={() => onGo('radar')} />
        <Kpi
          icon={Clock}
          label="Por vencer"
          value={r ? String(r.porVencer) : '—'}
          hint="Contáctalos antes de que se vayan"
          tone={r && r.porVencer > 0 ? 'warn' : 'neutral'}
          onClick={() => onGo('radar')}
        />
        <Kpi
          icon={AlertTriangle}
          label="Errores de la app (7 d)"
          value={errores === null ? '—' : String(errores)}
          tone={errores ? 'bad' : 'good'}
          onClick={() => onGo('errores')}
        />
        <Kpi
          icon={Sparkles}
          label="Costo de IA (30 d)"
          value={ia ? usd(ia.totalCostUsd) : '—'}
          hint={ia ? `${ia.totalCalls} llamadas · ${usd(ia.avgCostPerCallUsd)} c/u` : 'Sin datos aún'}
          onClick={() => onGo('ia')}
        />
        <Kpi
          icon={Bell}
          label="Push abiertos (30 d)"
          value={push ? (pushEnviados ? `${Math.round((pushAbiertos / pushEnviados) * 100)}%` : '—') : '—'}
          hint={push ? `${pushEnviados} enviados · ${push.personas} personas` : undefined}
          onClick={() => onGo('push')}
        />
        <Kpi icon={MapPin} label="Contactos del Mapa" value={r ? String(r.mapa.total) : '—'} onClick={() => onGo('mapa')} />
        <Kpi icon={Users} label="Miembros en la muestra" value={r ? String(r.muestra) : '—'} hint="Base de los porcentajes" onClick={() => onGo('resultados')} />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className={card}>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Camino de los miembros</h2>
          {r && r.embudo.length > 0 ? (
            <ul className="space-y-2">
              {r.embudo.map((e) => (
                <li key={e.clave}>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>{e.etiqueta}</span>
                    <span className="font-bold tabular-nums">{e.n}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-[#0B4079] dark:bg-[#C89B3C]" style={{ width: `${(e.n / embudoMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Sin datos todavía.</p>
          )}
        </div>

        <div className={card}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Costo de IA por día</h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">estimado · saldo real en console.anthropic.com</span>
          </div>
          {ia && ia.totalCalls > 0 ? (
            <>
              <div className="flex items-end gap-0.5 h-24" role="img" aria-label="Costo diario de IA, últimos 30 días">
                {costDays.map((d) => (
                  <div
                    key={d.day}
                    title={`${d.day}: ${usd(d.cost)}`}
                    className="flex-1 rounded-t bg-[#C89B3C]"
                    style={{ height: `${Math.max(d.cost > 0 ? 4 : 1, (d.cost / maxCost) * 100)}%`, opacity: d.cost > 0 ? 1 : 0.25 }}
                  />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                {Object.entries(ia.byModel).map(([model, m]) => (
                  <li key={model}>
                    <span className="font-semibold">{model}</span>: {m.calls} llamadas · {usd(m.costUsd)}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aún no hay llamadas registradas. Aparecerán desde que se despliegue el registro.</p>
          )}
        </div>
      </div>
    </div>
  )
}
