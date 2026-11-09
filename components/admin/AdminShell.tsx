'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Activity, BarChart3, Eye, EyeOff, LayoutDashboard, RefreshCw, Users, WifiOff, X } from 'lucide-react'
import LogoMark from '@/components/LogoMark'
import { FILTER_KEYS, VISTAS, isoWeek, usePanel, type Vista } from '@/lib/adminPanel'
import { subtle } from './ui'

interface AdminCtx {
  query: string
  filters: Record<string, string>
  setFilter: (key: string, value: string | null) => void
  go: (vista: Vista, params?: Record<string, string | null>) => void
  mostrar: boolean
}
const Ctx = createContext<AdminCtx | null>(null)
export const useAdmin = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAdmin se usa dentro de AdminShell')
  return c
}

const ICON: Record<Vista, typeof Users> = { resumen: LayoutDashboard, miembros: Users, radar: Activity, operacion: BarChart3 }
const PERIODOS = [
  { dias: '1', label: 'Hoy' },
  { dias: '7', label: '7 días' },
  { dias: '30', label: '30 días' },
  { dias: '90', label: '90 días' },
]
const LABEL: Record<string, string> = { plan: 'Plan', estado: 'Estado', etapa: 'Etapa', puesto: 'Puesto', pais: 'País', cohorte: 'Cohorte' }

function cohortesRecientes() {
  const out: string[] = []
  for (let i = 0; i < 10; i++) out.push(isoWeek(Date.now() - i * 7 * 86_400_000))
  return out
}

const selectCls =
  'rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-semibold px-2 py-1.5 focus-visible:outline-2 focus-visible:outline-[#C89B3C]'

// Estructura del panel: barra lateral en computador, barra inferior en celular. Los filtros viven en la URL,
// así que una vista filtrada se puede guardar o compartir. Los correos salen ocultos hasta que lo pides.
export default function AdminShell({ render }: { render: (vista: Vista, data: unknown) => React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [mostrar, setMostrar] = useState(false)

  const vistaParam = sp.get('vista')
  const vista: Vista = VISTAS.some((v) => v.id === vistaParam) ? (vistaParam as Vista) : 'resumen'
  const filters = useMemo(() => {
    const o: Record<string, string> = {}
    for (const k of FILTER_KEYS) {
      const v = sp.get(k)
      if (v) o[k] = v
    }
    if (!o.dias) o.dias = '30'
    return o
  }, [sp])
  const query = useMemo(() => new URLSearchParams(filters).toString(), [filters])

  const replace = useCallback(
    (next: URLSearchParams) => router.replace(`${pathname}?${next.toString()}`, { scroll: false }),
    [router, pathname]
  )
  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(sp.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      replace(next)
    },
    [sp, replace]
  )
  const go = useCallback(
    (v: Vista, params: Record<string, string | null> = {}) => {
      const next = new URLSearchParams(sp.toString())
      next.set('vista', v)
      for (const [k, val] of Object.entries(params)) {
        if (val) next.set(k, val)
        else next.delete(k)
      }
      replace(next)
    },
    [sp, replace]
  )

  const { data, conexion, error, actualizado, refrescando, reload } = usePanel<unknown>(vista, query, mostrar)
  const activos = Object.entries(filters).filter(([k]) => k !== 'dias')

  return (
    <Ctx.Provider value={{ query, filters, setFilter, go, mostrar }}>
      <div className="md:grid md:grid-cols-[13rem_1fr] min-h-screen bg-slate-50 dark:bg-slate-950">
        <aside className="hidden md:flex flex-col gap-1 p-4 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen">
          <Link href="/" className="flex items-center gap-2 mb-4" aria-label="Volver a la app">
            <LogoMark size={32} decorative />
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">JTA PRO</span>
          </Link>
          <nav aria-label="Vistas del panel" className="flex flex-col gap-1">
            {VISTAS.map((v) => {
              const Icon = ICON[v.id]
              const cur = v.id === vista
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => go(v.id)}
                  aria-current={cur ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-left focus-visible:outline-2 focus-visible:outline-[#C89B3C] ${cur ? 'bg-[#0B4079] text-white dark:bg-[#C89B3C] dark:text-slate-900' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {v.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="min-w-0 pb-24 md:pb-8">
          <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <Link href="/" className="md:hidden" aria-label="Volver a la app">
                <LogoMark size={28} decorative />
              </Link>
              <div className="flex items-center gap-1" role="group" aria-label="Periodo">
                {PERIODOS.map((p) => (
                  <button
                    key={p.dias}
                    type="button"
                    onClick={() => setFilter('dias', p.dias === '30' ? null : p.dias)}
                    aria-pressed={filters.dias === p.dias}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-full border focus-visible:outline-2 focus-visible:outline-[#C89B3C] ${filters.dias === p.dias ? 'bg-[#C89B3C] border-[#C89B3C] text-slate-900' : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-3 text-xs">
                <span className={`inline-flex items-center gap-1.5 font-bold ${conexion === 'caida' ? 'text-rose-700 dark:text-rose-400' : conexion === 'vivo' ? 'text-emerald-700 dark:text-emerald-400' : subtle}`} role="status">
                  {conexion === 'caida' ? (
                    <>
                      <WifiOff className="w-3.5 h-3.5" aria-hidden="true" /> Sin conexión
                    </>
                  ) : (
                    <>
                      <span className={`w-2 h-2 rounded-full ${conexion === 'vivo' ? 'bg-emerald-500 motion-safe:animate-pulse' : 'bg-slate-400'}`} aria-hidden="true" />
                      {conexion === 'vivo' ? 'En vivo' : 'Conectando'}
                    </>
                  )}
                </span>
                {actualizado && (
                  <span className={`hidden sm:inline ${subtle}`}>
                    Actualizado {new Date(actualizado).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
                <button type="button" onClick={reload} disabled={refrescando} className="inline-flex items-center gap-1 font-semibold text-[#0B4079] dark:text-[#C89B3C] disabled:opacity-50" aria-label="Actualizar ahora">
                  <RefreshCw className={`w-3.5 h-3.5 ${refrescando ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" /> <span className="hidden sm:inline">Actualizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMostrar((m) => !m)}
                  aria-pressed={mostrar}
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300"
                  title="Los correos salen ocultos. Actívalo solo para contactar a alguien."
                >
                  {mostrar ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
                  {mostrar ? 'Correos visibles' : 'Correos ocultos'}
                </button>
              </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 pb-2 flex flex-wrap items-center gap-2">
              <select aria-label="Filtrar por estado" className={selectCls} value={filters.estado || ''} onChange={(e) => setFilter('estado', e.target.value || null)}>
                <option value="">Estado: todos</option>
                <option value="activo">Activo</option>
                <option value="enfriandose">Enfriándose</option>
                <option value="en_riesgo">En riesgo</option>
                <option value="inactivo">Inactivo</option>
                <option value="nunca_entro">Nunca entró</option>
              </select>
              <select aria-label="Filtrar por plan" className={selectCls} value={filters.plan || ''} onChange={(e) => setFilter('plan', e.target.value || null)}>
                <option value="">Plan: todos</option>
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
              </select>
              <select aria-label="Filtrar por etapa" className={selectCls} value={filters.etapa || ''} onChange={(e) => setFilter('etapa', e.target.value || null)}>
                <option value="">Etapa: todas</option>
                <option value="busca">Búscalas</option>
                <option value="postula">Postula</option>
                <option value="seguimiento">Follow-up</option>
                <option value="entrevista">Entrevista</option>
              </select>
              <select aria-label="Filtrar por cohorte de ingreso" className={selectCls} value={filters.cohorte || ''} onChange={(e) => setFilter('cohorte', e.target.value || null)}>
                <option value="">Cohorte: todas</option>
                {cohortesRecientes().map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                aria-label="Filtrar por puesto"
                placeholder="Puesto…"
                defaultValue={filters.puesto || ''}
                key={`puesto-${filters.puesto || ''}`}
                onKeyDown={(e) => e.key === 'Enter' && setFilter('puesto', e.currentTarget.value.trim() || null)}
                onBlur={(e) => e.currentTarget.value.trim() !== (filters.puesto || '') && setFilter('puesto', e.currentTarget.value.trim() || null)}
                className={`${selectCls} w-28`}
              />
              <input
                aria-label="Filtrar por país"
                placeholder="País…"
                defaultValue={filters.pais || ''}
                key={`pais-${filters.pais || ''}`}
                onKeyDown={(e) => e.key === 'Enter' && setFilter('pais', e.currentTarget.value.trim() || null)}
                onBlur={(e) => e.currentTarget.value.trim() !== (filters.pais || '') && setFilter('pais', e.currentTarget.value.trim() || null)}
                className={`${selectCls} w-24`}
              />
            </div>
            {activos.length > 0 && (
              <div className="max-w-5xl mx-auto px-4 pb-2 flex flex-wrap items-center gap-1.5" aria-label="Filtros activos">
                {activos.map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFilter(k, null)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full bg-[#0B4079]/10 text-[#0B4079] dark:bg-[#C89B3C]/15 dark:text-[#C89B3C] px-2.5 py-1"
                    aria-label={`Quitar filtro ${LABEL[k] || k}: ${v}`}
                  >
                    {LABEL[k] || k}: {v} <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams()
                    next.set('vista', vista)
                    if (filters.dias !== '30') next.set('dias', filters.dias!)
                    replace(next)
                  }}
                  className="text-[11px] font-bold underline text-slate-600 dark:text-slate-300"
                >
                  Reiniciar filtros
                </button>
              </div>
            )}
          </header>

          <main className="max-w-5xl mx-auto px-4 pt-4 space-y-4">
            {error && (
              <p role="alert" className="text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
                {error} {data ? 'Estás viendo la última lectura correcta.' : ''}
              </p>
            )}
            {render(vista, data)}
          </main>
        </div>

        <nav aria-label="Vistas del panel" className="md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pb-[env(safe-area-inset-bottom)]">
          {VISTAS.map((v) => {
            const Icon = ICON[v.id]
            const cur = v.id === vista
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => go(v.id)}
                aria-current={cur ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${cur ? 'text-[#0B4079] dark:text-[#C89B3C]' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                {v.label}
              </button>
            )
          })}
        </nav>
      </div>
    </Ctx.Provider>
  )
}
