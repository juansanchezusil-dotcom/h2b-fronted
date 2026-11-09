'use client'

import type { MiembrosData } from '@/lib/adminPanel'
import MembershipsPanel from './MembershipsPanel'
import ClassOffersPanel from '@/components/ClassOffersPanel'
import { useAdmin } from './AdminShell'
import { Avatar, DayBars, Empty, ESTADO_LABEL, ESTADO_TONE, HBars, KpiCard, Pill, SectionTitle, Skeleton, SmallSample, STATUS_LABEL, card, subtle } from './ui'
import Collapsible from './Collapsible'

const REPLY_LABEL: Record<string, string> = { mas_datos: 'Piden más datos', entrevista: 'Entrevista', rechazo: 'Rechazo', otra: 'Otra' }

export function MiembrosView({ data }: { data: MiembrosData | null }) {
  const { filters, setFilter } = useAdmin()
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    )
  }
  const estadoRows = Object.entries(data.porEstadoApp)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ key: k, label: STATUS_LABEL[k] || k, value: v }))
  const totalApps = estadoRows.reduce((s, r) => s + r.value, 0)
  const respRows = Object.entries(data.respuestas).map(([k, v]) => ({ key: k, label: REPLY_LABEL[k] || k, value: v }))
  const paisRows = Object.entries(data.paises).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: k, value: v }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Miembros y embudo</h1>
        <SmallSample n={data.muestra} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {data.kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className={card}>
          <SectionTitle help="Cuántos miembros llegaron a cada etapa del camino (Búscalas, Postula, Follow-up, Entrevista). Se cuenta la etapa más avanzada de cada miembro, según el estado de sus empresas.">
            Embudo Búscalas → Entrevista
          </SectionTitle>
          <HBars
            rows={data.embudo.map((e) => ({ key: e.clave, label: e.etiqueta, value: e.n, sub: e.pctDelAnterior !== null ? `${e.pctDelAnterior}%` : undefined }))}
            selected={filters.etapa || null}
            onSelect={(key) => key !== 'acceso' && setFilter('etapa', filters.etapa === key ? null : key)}
          />
        </div>
        <div className={card}>
          <SectionTitle help="Accesos creados cada semana (accesos.created_at), las últimas 8 semanas.">Altas por semana</SectionTitle>
          {data.altasPorSemana.some((v) => v > 0) ? (
            <DayBars values={data.altasPorSemana} endDate={new Date()} movingAvg={99} stepDays={7} label="Altas por semana" />
          ) : (
            <Empty>Sin altas en las últimas 8 semanas.</Empty>
          )}
          <p className={`text-[11px] ${subtle}`}>Cada barra es una semana, la última a la derecha.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className={card}>
          <SectionTitle help="Cuántas empresas hay en cada estado del CRM de los miembros (applications.status).">
            Postulaciones por estado ({totalApps})
          </SectionTitle>
          {estadoRows.length ? <HBars rows={estadoRows} /> : <Empty>Aún no hay empresas guardadas.</Empty>}
        </div>
        <div className={card}>
          <SectionTitle help="Respuestas de empleadores que los miembros marcaron en sus tarjetas. Es un mínimo: solo cuentan las que marcaron.">
            Respuestas de empleadores
          </SectionTitle>
          {respRows.length ? <HBars rows={respRows} /> : <Empty>Ningún miembro ha marcado respuestas todavía.</Empty>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className={card}>
          <SectionTitle help="Puestos más postulados y cuántos tuvieron respuesta. Toca uno para filtrar el panel por ese puesto.">Puestos más postulados</SectionTitle>
          {data.puestos.length ? (
            <HBars
              rows={data.puestos.map((p) => ({ key: p.puesto, label: p.puesto, value: p.postulaciones, sub: `${p.respuestas} resp.` }))}
              selected={filters.puesto || null}
              onSelect={(key) => setFilter('puesto', filters.puesto === key ? null : key)}
            />
          ) : (
            <Empty>Sin postulaciones todavía.</Empty>
          )}
        </div>
        <div className={card}>
          <SectionTitle help="Miembros agrupados por la semana en que se les dio acceso, y cuántos de cada grupo entraron en los últimos 7 días. No es una curva de retención: hoy solo se guarda la última visita. Toca una cohorte para filtrar.">
            Cohortes de ingreso
          </SectionTitle>
          {data.cohortes.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left text-xs ${subtle}`}>
                  <th className="pb-1 font-semibold">Semana</th>
                  <th className="pb-1 font-semibold text-right">Ingresaron</th>
                  <th className="pb-1 font-semibold text-right">Activos hoy</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {data.cohortes.map((c) => (
                  <tr key={c.cohorte} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5">
                      <button type="button" onClick={() => setFilter('cohorte', filters.cohorte === c.cohorte ? null : c.cohorte)} aria-pressed={filters.cohorte === c.cohorte} className="font-semibold text-[#0B4079] dark:text-[#C89B3C] underline">
                        {c.cohorte}
                      </button>
                    </td>
                    <td className="py-1.5 text-right">{c.n}</td>
                    <td className="py-1.5 text-right">
                      {c.activosHoy} <span className={subtle}>({c.n ? Math.round((c.activosHoy / c.n) * 100) : 0}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>Sin miembros con fecha de alta.</Empty>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className={card}>
          <SectionTitle help="Miembros que vencen en los próximos 14 días, del más próximo al más lejano.">Vencimientos próximos (14 días)</SectionTitle>
          {data.vencimientos.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.vencimientos.map((v, i) => (
                <li key={i} className="py-2 flex items-center gap-3">
                  <Avatar label={v.quien.slice(0, 2)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{v.quien}</p>
                    <p className={`text-xs ${subtle} truncate`}>{v.correo}</p>
                  </div>
                  <Pill tone={v.dias <= 3 ? 'bad' : 'warn'}>{v.dias === 0 ? 'Hoy' : `${v.dias} d`}</Pill>
                  <Pill tone={ESTADO_TONE[v.estado] || 'info'}>{ESTADO_LABEL[v.estado] || v.estado}</Pill>
                  {v.contactadoRecien && <Pill tone="info">Contactado</Pill>}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nadie vence en los próximos 14 días.</Empty>
          )}
        </div>
        <div className={card}>
          <SectionTitle help="País de origen del perfil de cada miembro del filtro actual. Toca un país para filtrar.">País de origen</SectionTitle>
          {paisRows.length ? (
            <HBars rows={paisRows} selected={filters.pais || null} onSelect={(key) => setFilter('pais', filters.pais === key ? null : key)} />
          ) : (
            <Empty>Ningún perfil tiene país todavía.</Empty>
          )}
        </div>
      </div>

      <Collapsible title="Membresías" hint="Dar acceso cuando alguien paga en Skool, renovar o revocar.">
        <MembershipsPanel />
      </Collapsible>
      <Collapsible title="Ofertas de la clase" hint="Las que encuentras en vivo: aparecen en Mi Mapa de todos los miembros.">
        <ClassOffersPanel />
      </Collapsible>
    </div>
  )
}
