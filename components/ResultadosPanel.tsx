'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'

interface Resultados {
  muestra: number
  embudo: { clave: string; etiqueta: string; n: number }[]
  promedioPostulaciones30: number | null
  activos7: number
  vigentes: number
  porVencer: number
  vencidos: number
  puestos: { puesto: string; postulaciones: number; respuestas: number }[]
  respuestasEmpleador?: { postuladas: number; conRespuesta: number; masDatos: number; entrevista: number; rechazo: number; otra: number }
  mapa: { total: number; recordatorio: number; deBaja: number; excluidos: number; sonMiembros: number }
}

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4'

// Tablero de resultados: cuenta el camino de tus miembros y del Mapa público con los datos que ya existen.
export default function ResultadosPanel() {
  const [data, setData] = useState<Resultados | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await aiFetch('/api/admin/resultados')
      const body = await res.json().catch(() => ({}))
      if (cancelled) return
      if (!res.ok) setError(body.error || 'No se pudieron cargar los resultados.')
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
        <Loader2 className="w-4 h-4 animate-spin" /> Calculando...
      </div>
    )
  }

  const max = Math.max(1, ...data.embudo.map((e) => e.n))
  const pct = (n: number, base: number) => (base > 0 ? `${Math.round((n / base) * 100)}%` : '—')
  const base = data.embudo[1]?.n || 0 // quienes entraron a la app

  return (
    <div className="space-y-4">
      {data.muestra < 30 && (
        <p className="text-xs text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2">
          {`Hoy son ${data.muestra} miembros: con tan pocas personas los porcentajes cambian mucho con una sola persona. Úsalos como guía, no como cifra para publicar, hasta tener unos 30.`}
        </p>
      )}

      <section className={card} aria-labelledby="res-embudo">
        <h3 id="res-embudo" className="text-sm font-bold text-slate-900 dark:text-white mb-3">El camino de tus miembros</h3>
        <ul className="space-y-2.5">
          {data.embudo.map((e, i) => (
            <li key={e.clave} className="text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between gap-2">
                <span>{e.etiqueta}</span>
                <span className="font-semibold tabular-nums">
                  {e.n}
                  {i >= 2 && base > 0 && <span className="text-slate-400 dark:text-slate-500">{` · ${pct(e.n, base)}`}</span>}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-[#C89B3C]" style={{ width: `${Math.round((e.n / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
        {base > 0 && <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">El porcentaje es sobre quienes ya entraron a la app.</p>}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Postulaciones por miembro (30 días)', data.promedioPostulaciones30 === null ? '—' : String(data.promedioPostulaciones30)],
          ['Entraron en los últimos 7 días', `${data.activos7} de ${data.muestra}`],
          ['Por vencer en 7 días', String(data.porVencer)],
          ['Con acceso vencido', String(data.vencidos)],
        ].map(([k, v]) => (
          <div key={k} className={card}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{k}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <section className={card} aria-labelledby="res-puestos">
        <h3 id="res-puestos" className="text-sm font-bold text-slate-900 dark:text-white mb-2">Puestos más buscados</h3>
        {data.puestos.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Todavía no hay postulaciones.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.puestos.map((p) => (
              <li key={p.puesto} className="py-1.5 flex justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="min-w-0 truncate">{p.puesto}</span>
                <span className="tabular-nums shrink-0">{`${p.postulaciones} postulaciones · ${p.respuestas} con respuesta`}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.respuestasEmpleador && (
        <section className={card} aria-labelledby="res-resp">
          <h3 id="res-resp" className="text-sm font-bold text-slate-900 dark:text-white mb-2">Respuestas de empleadores</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {`${data.respuestasEmpleador.conRespuesta} respuestas registradas de ${data.respuestasEmpleador.postuladas} postulaciones (${pct(data.respuestasEmpleador.conRespuesta, data.respuestasEmpleador.postuladas)})`}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {`${data.respuestasEmpleador.entrevista} invitaron a entrevista · ${data.respuestasEmpleador.masDatos} pidieron más datos · ${data.respuestasEmpleador.rechazo} dijeron que no · ${data.respuestasEmpleador.otra} otra`}
          </p>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Es un mínimo: solo cuentan las respuestas que los miembros marcaron en su tarjeta. La cifra real es mayor.</p>
        </section>
      )}

      <section className={card} aria-labelledby="res-mapa">
        <h3 id="res-mapa" className="text-sm font-bold text-slate-900 dark:text-white mb-2">Mapa público</h3>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {`${data.mapa.total} contactos · ${data.mapa.recordatorio} con recordatorio enviado · ${data.mapa.deBaja} de baja · ${data.mapa.excluidos} excluidos · ${data.mapa.sonMiembros} ya son miembros`}
        </p>
      </section>
    </div>
  )
}
