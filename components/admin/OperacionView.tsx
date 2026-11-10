'use client'

import type { OperacionData } from '@/lib/adminPanel'
import { usd } from '@/lib/adminPanel'
import ErrorsPanel from '@/components/ErrorsPanel'
import IaCostsPanel from '@/components/IaCostsPanel'
import Collapsible from './Collapsible'
import { DayBars, Empty, HBars, HowTo, KpiCard, Pill, SectionTitle, Skeleton, card, subtle } from './ui'

const FEATURE_LABEL: Record<string, string> = {
  cv: 'CV',
  carta: 'Carta',
  correo: 'Correo',
  simulador: 'Simulador de entrevista',
  cv_entrevista: 'Entrevista del CV',
  detector_estafa: 'Detector de estafas (imagen)',
  detector_web: 'Detector de estafas (web)',
  asistente: 'Pregúntale a Juan',
  sin_dato: 'Sin clasificar',
}
const LIMIT_LABEL: Record<string, string> = { ai: 'Asistentes (general)', cv_turn: 'Entrevista del CV', interview_turn: 'Simulador', asistente: 'Pregúntale a Juan' }

export function OperacionView({ data }: { data: OperacionData | null }) {
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    )
  }
  const { ia, errores } = data
  const gastado = ia.presupuesto.gastadoRegistrado
  const pct = Math.min(100, Math.round((gastado / ia.presupuesto.usd) * 100))
  const tone = pct >= 80 ? 'bg-rose-500' : pct >= 50 ? 'bg-[#C89B3C]' : 'bg-emerald-500'
  const modelRows = Object.entries(ia.porModelo).map(([k, v]) => ({ key: k, label: k, value: v.costUsd, sub: `${v.calls} llamadas` }))
  const featureRows = Object.entries(ia.porFuncion)
    .sort((a, b) => b[1].costUsd - a[1].costUsd)
    .map(([k, v]) => ({ key: k, label: FEATURE_LABEL[k] || k, value: v.costUsd, sub: `${v.calls} llamadas` }))
  const errorRows = Object.entries(errores.porTipo).map(([k, v]) => ({ key: k, label: k, value: v }))
  const limites = Object.entries(data.limites.hoy)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Operación</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {data.kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} invert />
        ))}
        <div className={card}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Costo de IA por miembro</p>
            <HowTo text="Costo estimado de IA del periodo dividido entre los miembros vigentes (sin filtros de miembro)." />
          </div>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{ia.costoPorMiembro === null ? '—' : usd(ia.costoPorMiembro)}</p>
          <p className={`text-xs ${subtle} mt-1`}>{ia.llamadas} llamadas en el periodo</p>
        </div>
        <div className={card}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Presupuesto de IA</p>
            <HowTo text="Lo gastado desde que empezó el registro de tokens, frente a tu presupuesto (variable AI_BUDGET_USD, $20 por defecto). No es el saldo real: ese está en console.anthropic.com." />
          </div>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{pct}%</p>
          <div className="h-2.5 mt-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Presupuesto de IA gastado">
            <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
          </div>
          <p className={`text-xs ${subtle} mt-1`}>
            {usd(gastado)} de {usd(ia.presupuesto.usd)} registrado
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className={card}>
          <SectionTitle help="Costo estimado de Claude por día: tokens registrados por la tarifa de cada modelo. No incluye las respuestas de respaldo de Gemini.">Costo de IA por día</SectionTitle>
          {ia.porDia.some((v) => v > 0) ? <DayBars values={ia.porDia} format={usd} label="Costo de IA por día" /> : <Empty>Aún no hay llamadas registradas en este periodo.</Empty>}
        </div>
        <div className={card}>
          <SectionTitle help="Errores que reportó la app de los miembros, por día.">Errores por día</SectionTitle>
          {errores.porDia.some((v) => v > 0) ? <DayBars values={errores.porDia} label="Errores por día" /> : <Empty>Sin errores en este periodo.</Empty>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className={card}>
          <SectionTitle>Costo por modelo</SectionTitle>
          {modelRows.length ? <HBars rows={modelRows} format={usd} /> : <Empty>Sin datos.</Empty>}
        </div>
        <div className={card}>
          <SectionTitle help="Costo por asistente, solo de las llamadas hechas con sesión de miembro desde que se activó este detalle. El resto aparece en 'Costo por modelo'.">
            Costo por función
          </SectionTitle>
          {featureRows.length ? <HBars rows={featureRows} format={usd} /> : <Empty>Se llenará con el uso nuevo de los asistentes.</Empty>}
          {ia.cobertura !== null && <p className={`text-[11px] ${subtle} mt-2`}>{ia.cobertura}% del costo ya está atribuido a una función.</p>}
        </div>
        <div className={card}>
          <SectionTitle>Errores por tipo</SectionTitle>
          {errorRows.length ? <HBars rows={errorRows} /> : <Empty>Sin errores.</Empty>}
        </div>
      </div>

      <div className={card}>
        <SectionTitle help="Usos de IA que llevan los miembros hoy (UTC), por asistente. El límite diario protege el gasto.">Límites de uso de hoy</SectionTitle>
        {limites.length ? (
          <ul className="flex flex-wrap gap-2">
            {limites.map(([k, v]) => (
              <li key={k}>
                <Pill tone="info">
                  {LIMIT_LABEL[k] || k}: {v}
                </Pill>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nadie ha usado los asistentes hoy.</Empty>
        )}
      </div>

      <Collapsible title="Errores de la app" hint="Detalle de las fallas de los últimos 7 días, agrupadas.">
        <ErrorsPanel />
      </Collapsible>
      <Collapsible title="Costos de IA (detalle)" hint="Tabla por modelo con tokens de entrada y salida.">
        <IaCostsPanel />
      </Collapsible>
    </div>
  )
}
