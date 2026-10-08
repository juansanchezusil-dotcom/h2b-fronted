'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Radar } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'

type Estado = 'activo' | 'enfriandose' | 'en_riesgo' | 'inactivo' | 'nunca_entro'

interface Miembro {
  email: string
  nombre: string | null
  estado: Estado
  diasSinEntrar: number | null
  fuenteVisita: 'app' | 'login' | null
  postulaciones30: number
  diasParaVencer: number | null
  origen: string | null
  sinArrancar: boolean
  estancado: boolean
  porVencer: boolean
  prioridadRenovacion: boolean
  compromiso: { dia: number | null; llegoAlDia30: boolean; califica: boolean | null; faltan: string[] }
}

interface RadarData {
  config: { goal: number; commitmentDays: number; coolingDays: number; riskDays: number; inactiveDays: number }
  resumen: {
    total: number
    porEstado: Record<Estado, number>
    sinArrancar: number
    estancados: number
    porVencer: number
    prioridadRenovacion: number
    califican: number
    noCalifican: number
  }
  miembros: Miembro[]
  generado: string
}

type Filtro = 'todos' | Estado | 'por_vencer' | 'renovacion' | 'sin_arrancar' | 'estancado'

const ESTADOS: Record<Estado, { label: string; badge: string }> = {
  activo: { label: 'Activo', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  enfriandose: { label: 'Enfriándose', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  en_riesgo: { label: 'En riesgo', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' },
  inactivo: { label: 'Inactivo', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' },
  nunca_entro: { label: 'Nunca entró', badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
}

const pluralDias = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`

function visita(m: Miembro) {
  if (m.diasSinEntrar === null) return 'Nunca'
  const base = m.diasSinEntrar === 0 ? 'Hoy' : m.diasSinEntrar === 1 ? 'Ayer' : `Hace ${pluralDias(m.diasSinEntrar)}`
  return m.fuenteVisita === 'login' ? `${base} (inicio de sesión)` : base
}

function vence(m: Miembro) {
  if (m.diasParaVencer === null) return 'Sin vencimiento'
  if (m.diasParaVencer < 0) return `Venció hace ${pluralDias(-m.diasParaVencer)}`
  if (m.diasParaVencer === 0) return 'Vence hoy'
  return `En ${pluralDias(m.diasParaVencer)}`
}

function compromiso(m: Miembro, commitmentDays: number) {
  const c = m.compromiso
  if (!c.llegoAlDia30) return c.dia === null ? '—' : `Día ${c.dia} de ${commitmentDays}`
  return c.califica ? 'Califica para diagnóstico' : `No califica: falta ${c.faltan.join(', ')}`
}

function pasaFiltro(m: Miembro, f: Filtro) {
  switch (f) {
    case 'todos':
      return true
    case 'por_vencer':
      return m.porVencer
    case 'renovacion':
      return m.prioridadRenovacion
    case 'sin_arrancar':
      return m.sinArrancar
    case 'estancado':
      return m.estancado
    default:
      return m.estado === f
  }
}

export default function RadarPanel() {
  const [data, setData] = useState<RadarData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiFetch('/api/admin/radar')
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'No se pudo cargar el radar.')
      setData(body)
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el radar.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const chips: { id: Filtro; label: string; n: number }[] = data
    ? [
        { id: 'todos', label: 'Todos', n: data.resumen.total },
        { id: 'renovacion', label: 'Renovación urgente', n: data.resumen.prioridadRenovacion },
        { id: 'por_vencer', label: 'Por vencer', n: data.resumen.porVencer },
        { id: 'nunca_entro', label: 'Nunca entró', n: data.resumen.porEstado.nunca_entro },
        { id: 'sin_arrancar', label: 'Sin arrancar', n: data.resumen.sinArrancar },
        { id: 'en_riesgo', label: 'En riesgo', n: data.resumen.porEstado.en_riesgo },
        { id: 'inactivo', label: 'Inactivos', n: data.resumen.porEstado.inactivo },
        { id: 'enfriandose', label: 'Enfriándose', n: data.resumen.porEstado.enfriandose },
        { id: 'estancado', label: 'Estancados', n: data.resumen.estancados },
        { id: 'activo', label: 'Activos', n: data.resumen.porEstado.activo },
      ]
    : []

  const visibles = data ? data.miembros.filter((m) => pasaFiltro(m, filtro)) : []

  return (
    <section aria-labelledby="radar-titulo" className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="radar-titulo" className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
            <Radar className="w-5 h-5 text-[#C89B3C]" aria-hidden="true" /> Radar de actividad
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quién se está enfriando y a quién renovar. Ordenado por prioridad.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#0B4079] dark:text-[#C89B3C] hover:underline disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Actualizar
        </button>
      </div>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Calculando...
        </div>
      )}

      {data && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar miembros">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={filtro === c.id}
                onClick={() => setFiltro(c.id)}
                className={`text-xs font-semibold rounded-full border px-3 py-1 transition ${
                  filtro === c.id
                    ? 'border-[#C89B3C] bg-amber-50 dark:bg-amber-500/10 text-[#08131F] dark:text-amber-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                } ${c.n === 0 && filtro !== c.id ? 'opacity-50' : ''}`}
              >
                {c.label} <span className="tabular-nums">({c.n})</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compromiso de PRO a los {data.config.commitmentDays} días: califican <strong>{data.resumen.califican}</strong>, no califican{' '}
            <strong>{data.resumen.noCalifican}</strong>. La meta es {data.config.goal} postulaciones a empresas distintas, más perfil y CV.
          </p>

          <ul className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            {visibles.length === 0 && <li className="p-4 text-sm text-slate-500 dark:text-slate-400">Nadie en este grupo.</li>}
            {visibles.map((m) => (
              <li key={m.email} className="p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    {m.nombre && <p className="text-sm font-semibold text-slate-800 dark:text-white">{m.nombre}</p>}
                    <p className="text-xs text-slate-500 dark:text-slate-400 break-all">{m.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {m.prioridadRenovacion && (
                      <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-[#C89B3C] text-[#08131F]">Renovación urgente</span>
                    )}
                    {m.porVencer && !m.prioridadRenovacion && (
                      <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Por vencer</span>
                    )}
                    {m.sinArrancar && (
                      <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">Sin arrancar</span>
                    )}
                    {m.estancado && (
                      <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">Estancado</span>
                    )}
                    <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${ESTADOS[m.estado].badge}`}>{ESTADOS[m.estado].label}</span>
                  </div>
                </div>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="text-slate-400 dark:text-slate-500">Última visita</dt>
                    <dd className="font-medium text-slate-700 dark:text-slate-200">{visita(m)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 dark:text-slate-500">Postulaciones (30 días)</dt>
                    <dd className="font-medium text-slate-700 dark:text-slate-200 tabular-nums">
                      {m.postulaciones30} de {data.config.goal}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 dark:text-slate-500">Vence</dt>
                    <dd className="font-medium text-slate-700 dark:text-slate-200">{vence(m)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 dark:text-slate-500">Compromiso</dt>
                    <dd className="font-medium text-slate-700 dark:text-slate-200">{compromiso(m, data.config.commitmentDays)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            La última visita viene de la app; si aún no hay, del último inicio de sesión. Las postulaciones cuentan empresas distintas que
            salieron de &quot;guardadas&quot;; el historial empezó el 7 de octubre de 2026, así que antes de esa fecha es aproximado. Quien postula
            por correo sin registrarlo en el CRM no se refleja aquí.
          </p>
        </>
      )}
    </section>
  )
}
