'use client'

import type { RadarData } from '@/lib/adminPanel'
import RadarPanel from '@/components/RadarPanel'
import EngagementPanel from '@/components/EngagementPanel'
import PushStatsPanel from '@/components/PushStatsPanel'
import MapLeadsPanel from '@/components/MapLeadsPanel'
import { useAdmin } from './AdminShell'
import { InsightList } from './ResumenView'
import Collapsible from './Collapsible'
import { Avatar, Empty, ESTADO_LABEL, ESTADO_TONE, HBars, Pill, SectionTitle, Skeleton, SmallSample, card, subtle } from './ui'

export function RadarView({ data }: { data: RadarData | null }) {
  const { filters, setFilter, mostrar } = useAdmin()
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    )
  }
  const r = data.resumen
  const estadoRows = Object.entries(ESTADO_LABEL).map(([k, label]) => ({ key: k, label, value: r.porEstado[k] ?? 0 }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Radar de intervención</h1>
        <SmallSample n={data.muestra} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={card}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Por contactar</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{r.porContactar}</p>
          <p className={`text-xs ${subtle}`}>con algo que hacer y sin contacto reciente</p>
        </div>
        <div className={card}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Candidatos Accelerator</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{r.candidatosAcelerador}</p>
          <p className={`text-xs ${subtle}`}>con un cuello de botella real</p>
        </div>
        <div className={card}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Por vencer (7 d)</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{r.porVencer}</p>
          <p className={`text-xs ${subtle}`}>{r.sinArrancar} sin arrancar · {r.estancados} estancados</p>
        </div>
        <div className={card}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Casos de éxito</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{r.casosExito}</p>
          <p className={`text-xs ${subtle}`}>con una empresa aceptada</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className={card}>
          <SectionTitle help="Estado según los días sin entrar a la app: activo (menos de 7), enfriándose (7), en riesgo (15), inactivo (22 o más), nunca entró. Toca un estado para filtrar todo el panel.">
            Estado de actividad
          </SectionTitle>
          <HBars
            rows={estadoRows}
            selected={filters.estado || null}
            onSelect={(key) => setFilter('estado', filters.estado === key ? null : key)}
          />
        </div>

        <div className={card}>
          <SectionTitle help="Miembros con algo que hacer (renovación, sin arrancar, en riesgo, cuello de botella) a los que no se les ha escrito en los últimos 7 días. Los correos y nombres salen ocultos hasta que actives “Correos visibles”.">
            A quién escribirle hoy
          </SectionTitle>
          {data.lista.length === 0 ? (
            <Empty>Nadie pendiente. Todos los que necesitaban algo ya fueron contactados.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.lista.map((m, i) => (
                <li key={i} className="py-2 flex items-center gap-3">
                  <Avatar label={m.quien.slice(0, 2)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{mostrar ? m.quien : `Miembro ${m.quien}`}</p>
                    <p className={`text-xs ${subtle} truncate`}>{m.motivo}</p>
                    {mostrar && <p className={`text-xs ${subtle} truncate`}>{m.correo}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Pill tone={ESTADO_TONE[m.estado] || 'info'}>{ESTADO_LABEL[m.estado] || m.estado}</Pill>
                    {m.acelerador && <Pill tone="warn">Accelerator</Pill>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={card}>
        <SectionTitle help="Reglas fijas sobre los miembros del filtro actual. La causa probable siempre se marca como hipótesis. Con pocas personas (n bajo) úsalo como guía.">
          Qué está pasando y qué hacer
        </SectionTitle>
        <InsightList items={data.insights} empty="Nada que señalar con este filtro." />
      </div>

      <Collapsible title="Detalle completo del radar" hint="Lista completa con contacto, notas y mensajes (muestra correos).">
        <RadarPanel />
      </Collapsible>
      <Collapsible title="Correos automáticos" hint="Renovación y reenganche: estado, pruebas y a quién se escribiría.">
        <EngagementPanel />
      </Collapsible>
      <Collapsible title="Avisos push" hint="Últimos 30 días: cuántos se enviaron y cuántos abrieron la app desde el aviso.">
        <PushStatsPanel />
      </Collapsible>
      <Collapsible title="Contactos del Mapa público" hint="Personas que dejaron su correo en mapa.juanteavisa.com (hoy casi vacío).">
        <MapLeadsPanel />
      </Collapsible>
    </div>
  )
}
