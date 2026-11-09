'use client'

import { Radio } from 'lucide-react'
import type { Insight, ResumenData } from '@/lib/adminPanel'
import { usd } from '@/lib/adminPanel'
import { useAdmin } from './AdminShell'
import { DayBars, Empty, HBars, HowTo, KpiCard, Pill, Ring, SectionTitle, Skeleton, SmallSample, STATUS_LABEL, ago, card, subtle } from './ui'

const NIVEL_TONE = { alto: 'bad', medio: 'warn', info: 'good' } as const
const NIVEL_LABEL = { alto: 'Urgente', medio: 'Atención', info: 'Oportunidad' } as const

export function InsightList({ items, empty }: { items: Insight[]; empty: string }) {
  const { go } = useAdmin()
  if (!items.length) return <Empty>{empty}</Empty>
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((i) => (
        <li key={i.id} className="py-3 flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-[14rem] space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={NIVEL_TONE[i.nivel]}>{NIVEL_LABEL[i.nivel]}</Pill>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{i.titulo}</p>
            </div>
            <p className={`text-sm ${subtle}`}>{i.dato}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 italic">{i.hipotesis}</p>
            <p className="text-sm text-slate-800 dark:text-slate-100">
              <span className="font-bold">Qué hacer:</span> {i.accion}
            </p>
            <SmallSample n={i.n} />
          </div>
          <button
            type="button"
            onClick={() => go(i.filtro.vista, i.filtro.estado ? { estado: i.filtro.estado } : {})}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-[#0B4079] dark:text-[#C89B3C] hover:border-[#C89B3C]"
          >
            Ver lista
          </button>
        </li>
      ))}
    </ul>
  )
}

export function ResumenView({ data }: { data: ResumenData | null }) {
  const { go, setFilter, filters } = useAdmin()
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }
  const k = (id: string) => data.kpis.find((x) => x.id === id)!
  const kpiOrder = ['miembros', 'nuevos', 'vencen7', 'activacion', 'postulaciones', 'respuesta', 'entrevistas', 'leads', 'costoIa', 'errores24h']
  const target: Record<string, () => void> = {
    miembros: () => go('miembros'),
    nuevos: () => go('miembros'),
    vencen7: () => go('radar'),
    activacion: () => go('miembros'),
    postulaciones: () => go('miembros'),
    respuesta: () => go('miembros'),
    entrevistas: () => go('miembros'),
    costoIa: () => go('operacion'),
    errores24h: () => go('operacion'),
  }
  const sinDatos = data.muestra === 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Resumen ejecutivo</h1>
        <p className={`text-xs ${subtle}`}>
          {data.muestra} de {data.totalMiembros} miembros en este filtro
        </p>
      </div>

      {sinDatos && <Empty>Ningún miembro cumple estos filtros. Quita alguno para ver datos.</Empty>}

      <div className="grid md:grid-cols-3 gap-3">
        <div className={`${card} flex items-center gap-4`}>
          <Ring value={data.salud.valor} label="Salud del negocio" />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Salud del negocio</p>
              <HowTo text={data.definiciones.salud} />
            </div>
            <ul className="mt-1 space-y-0.5">
              {data.salud.desglose.map((d) => (
                <li key={d.clave} className="text-xs text-slate-700 dark:text-slate-300 tabular-nums">
                  {d.clave}: <span className="font-bold">{d.puntos}</span>/{d.max}
                </li>
              ))}
            </ul>
            <div className="mt-1">
              <SmallSample n={data.salud.n} />
            </div>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ingreso mensual estimado</p>
            <HowTo text={data.definiciones.ingreso} />
          </div>
          <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">{usd(data.ingreso.total)}</p>
          <p className={`text-xs ${subtle} mt-1`}>
            Estimado, no es cobro real. {data.ingreso.porPlan.mensual.n} mensual · {data.ingreso.porPlan.anual.n} anual (prorrateado)
          </p>
          {(data.ingreso.sinPlan > 0 || data.ingreso.excluidos > 0) && (
            <p className={`text-[11px] ${subtle} mt-1`}>
              {data.ingreso.sinPlan > 0 && `${data.ingreso.sinPlan} sin vencimiento (no cuenta). `}
              {data.ingreso.excluidos > 0 && `${data.ingreso.excluidos} de prueba o tuyo (no cuenta).`}
            </p>
          )}
        </div>

        <div className={card}>
          <SectionTitle>Camino del miembro</SectionTitle>
          <HBars
            rows={data.embudo.map((e) => ({ key: e.clave, label: e.etiqueta, value: e.n, sub: e.pctDelAnterior !== null ? `${e.pctDelAnterior}%` : undefined }))}
            selected={filters.etapa || null}
            onSelect={(key) => {
              if (key === 'acceso') return setFilter('etapa', null)
              setFilter('etapa', filters.etapa === key ? null : key)
            }}
          />
          <p className={`text-[11px] ${subtle} mt-2`}>Toca una etapa para filtrar todo el panel. Porcentaje frente a la etapa anterior.</p>
        </div>
      </div>

      <div className={card}>
        <SectionTitle help="Tres reglas fijas calculadas con las cifras de arriba: por vencer sin avanzar, sin arrancar y cuellos de botella del Accelerator. Son hipótesis, no certezas.">
          Qué está pasando y qué hacer hoy
        </SectionTitle>
        <InsightList items={data.acciones} empty="Nada urgente hoy. Cuando haya algo, aparece aquí con qué hacer." />
        {data.insights.length > data.acciones.length && (
          <button type="button" onClick={() => go('radar')} className="mt-2 text-xs font-bold text-[#0B4079] dark:text-[#C89B3C] underline">
            Ver las {data.insights.length} alertas en Radar
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpiOrder.map((id) => (
          <KpiCard key={id} kpi={k(id)} invert={id === 'errores24h' || id === 'costoIa'} onClick={target[id]} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className={card}>
          <SectionTitle help={k('postulaciones').definicion}>Postulaciones por día</SectionTitle>
          {k('postulaciones').spark.some((v) => v > 0) ? (
            <DayBars values={k('postulaciones').spark} label="Postulaciones por día con promedio móvil" />
          ) : (
            <Empty>Sin postulaciones en este periodo.</Empty>
          )}
        </div>

        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white inline-flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Actividad en vivo
            </h2>
            <span className={`text-[11px] ${subtle}`}>se actualiza cada 30 s</span>
          </div>
          {data.actividad.length === 0 ? (
            <Empty>Aún no hay movimientos de postulaciones en este periodo.</Empty>
          ) : (
            <ol className="space-y-2">
              {data.actividad.map((a, i) => (
                <li key={`${a.t}-${i}`} className="flex gap-2 text-sm">
                  <span className={`w-14 shrink-0 text-xs ${subtle}`}>{ago(a.t)}</span>
                  <span className="text-slate-800 dark:text-slate-100">
                    <span className="capitalize">{a.empresa}</span> pasó a <span className="font-semibold">{STATUS_LABEL[a.estado] || a.estado}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
