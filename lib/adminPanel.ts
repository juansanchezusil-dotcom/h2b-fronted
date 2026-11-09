'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { aiFetch } from '@/lib/aiFetch'

// ---- tipos de lo que devuelve /api/admin/panel (ver src/admin/panel.ts en el backend) ----
export interface Kpi {
  id: string
  titulo: string
  valor: number | null
  formato: 'n' | 'usd' | 'pct'
  variacionPct: number | null
  spark: number[]
  n?: number
  definicion: string
}
export interface Insight {
  id: string
  nivel: 'alto' | 'medio' | 'info'
  titulo: string
  dato: string
  n: number
  muestraChica: boolean
  hipotesis: string
  accion: string
  filtro: { vista: 'radar' | 'miembros' | 'operacion'; estado?: string }
}
export interface EmbudoPaso {
  clave: string
  etiqueta: string
  n: number
  pctDelAnterior: number | null
}
interface Base {
  generado: string
  muestra: number
  totalMiembros: number
  definiciones: { salud: string; ingreso: string }
}
export interface ResumenData extends Base {
  kpis: Kpi[]
  salud: { valor: number | null; n: number; desglose: { clave: string; puntos: number; max: number }[] }
  ingreso: { total: number; porPlan: { mensual: { n: number; usd: number }; anual: { n: number; usd: number } }; sinPlan: number; excluidos: number }
  acciones: Insight[]
  insights: Insight[]
  embudo: EmbudoPaso[]
  actividad: { t: string; estado: string; empresa: string; desde: string | null }[]
}
export interface MiembrosData extends Base {
  kpis: Kpi[]
  embudo: EmbudoPaso[]
  porEstadoApp: Record<string, number>
  puestos: { puesto: string; postulaciones: number; respuestas: number }[]
  respuestas: Record<string, number>
  cohortes: { cohorte: string; n: number; activosHoy: number }[]
  altasPorSemana: number[]
  vencimientos: { quien: string; correo: string; dias: number; estado: string; plan: string; contactadoRecien: boolean }[]
  paises: Record<string, number>
}
export interface RadarData extends Base {
  resumen: {
    total: number
    porEstado: Record<string, number>
    porContactar: number
    candidatosAcelerador: number
    sinArrancar: number
    estancados: number
    porVencer: number
    casosExito: number
  }
  insights: Insight[]
  lista: { quien: string; correo: string; estado: string; motivo: string; diasSinEntrar: number | null; acelerador: boolean; nota: string | null }[]
}
export interface OperacionData extends Base {
  kpis: Kpi[]
  ia: {
    totalUsd: number
    llamadas: number
    porDia: number[]
    porModelo: Record<string, { calls: number; costUsd: number }>
    porFuncion: Record<string, { calls: number; costUsd: number }>
    costoPorMiembro: number | null
    cobertura: number | null
    presupuesto: { usd: number; gastadoRegistrado: number }
  }
  errores: { total: number; porTipo: Record<string, number>; porDia: number[] }
  limites: { hoy: Record<string, number> }
}

export type Vista = 'resumen' | 'miembros' | 'radar' | 'operacion'
export const VISTAS: { id: Vista; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'miembros', label: 'Miembros' },
  { id: 'radar', label: 'Radar' },
  { id: 'operacion', label: 'Operación' },
]
export const FILTER_KEYS = ['dias', 'plan', 'estado', 'etapa', 'puesto', 'pais', 'cohorte'] as const

const POLL_MS = 30_000

export type Conexion = 'cargando' | 'vivo' | 'caida'

// Lee una vista del panel y la refresca cada 30 s. Se pausa con la pestaña oculta, vuelve a pedir al regresar
// y muestra si la conexión se cayó (sin borrar lo último que se vio). Es polling y no Supabase Realtime a propósito:
// el panel usa la clave de servicio en el backend, y abrir lecturas privadas al navegador sería peor que esperar 30 s.
export function usePanel<T>(vista: Vista, query: string, mostrar: boolean) {
  const [data, setData] = useState<T | null>(null)
  const [conexion, setConexion] = useState<Conexion>('cargando')
  const [error, setError] = useState<string | null>(null)
  const [actualizado, setActualizado] = useState<number | null>(null)
  const [refrescando, setRefrescando] = useState(false)
  const seq = useRef(0)
  // Invalida lo que siga en vuelo al cambiar de vista o desmontar
  const invalidate = useCallback(() => {
    seq.current++
  }, [])

  const load = useCallback(async () => {
    const mine = ++seq.current
    setRefrescando(true)
    try {
      const qs = new URLSearchParams(query)
      qs.set('vista', vista)
      if (mostrar) qs.set('mostrar', '1')
      const res = await aiFetch(`/api/admin/panel?${qs.toString()}`)
      const body = await res.json().catch(() => ({}))
      if (mine !== seq.current) return // llegó una respuesta más nueva
      if (!res.ok) {
        setError(res.status === 403 ? 'Tu cuenta no es administradora.' : res.status === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.' : body.error || 'No se pudo cargar el panel.')
        setConexion('caida')
        return
      }
      setData(body as T)
      setError(null)
      setConexion('vivo')
      setActualizado(Date.now())
    } catch {
      if (mine !== seq.current) return
      setError('Sin conexión con el servidor. Reintentando...')
      setConexion('caida')
    } finally {
      if (mine === seq.current) setRefrescando(false)
    }
  }, [vista, query, mostrar])

  useEffect(() => {
    // Al cambiar de vista o de filtros se pide de nuevo; no se borra lo anterior hasta que llegue lo nuevo
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    const tick = () => {
      if (document.visibilityState === 'visible') load()
    }
    const id = window.setInterval(tick, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      invalidate()
    }
  }, [load, invalidate])

  return { data, conexion, error, actualizado, refrescando, reload: load }
}

// Semana ISO ("2026-W45"), igual que el backend, para ofrecer cohortes en los filtros
export function isoWeek(ms: number): string {
  const d = new Date(ms)
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y = t.getUTCFullYear()
  const week = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86_400_000 + 1) / 7)
  return `${y}-W${String(week).padStart(2, '0')}`
}

export const fmtValor = (v: number | null, f: Kpi['formato']) => {
  if (v === null) return '—'
  if (f === 'usd') return `$${v < 1 ? v.toFixed(3) : v.toFixed(2)}`
  if (f === 'pct') return `${v}%`
  return v.toLocaleString('es')
}
export const usd = (n: number) => `$${n < 1 ? n.toFixed(3) : n.toFixed(2)}`
