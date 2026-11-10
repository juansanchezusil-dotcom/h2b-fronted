'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'
import { errorMessage } from '@/lib/errors'
import { useAdmin } from './AdminShell'
import { Avatar, ESTADO_LABEL, ESTADO_TONE, Empty, Pill, subtle } from './ui'

interface Fila {
  quien: string
  correo: string
  estado: string
  diasSinEntrar: number | null
  enviados: { tipo: string; en: string }[]
  sinRespuesta: number
  baja: boolean
  contactadoEl: string | null
  canalContacto: string | null
  veredicto: { tono: 'ok' | 'aviso' | 'alto'; texto: string }
}

const KIND_LABEL: Record<string, string> = {
  reengage: 'Reenganche',
  renewal_7: 'Renovación (7 días)',
  renewal_3: 'Renovación (3 días)',
  renewal_after: 'Acceso vencido',
  reto_30: 'Reto de 30 días',
  ofertas: 'Ofertas nuevas',
}
const CANAL: Record<string, string> = { skool: 'Skool', correo: 'correo', telefono: 'teléfono', otro: 'otro canal' }
const TONO = { ok: 'good', aviso: 'warn', alto: 'bad' } as const
const TONO_TEXTO = { ok: 'Al día', aviso: 'Atención', alto: 'Escríbele tú' } as const

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })

// Qué correos automáticos recibió cada miembro y si volvió a entrar después. Solo muestra el envío:
// no sabemos si abrió el correo (eso está en Resend).
export default function CorreosMiembros() {
  const { mostrar } = useAdmin()
  const [filas, setFilas] = useState<Fila[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiFetch(`/api/admin/correos${mostrar ? '?mostrar=1' : ''}`)
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'No se pudo cargar el historial de correos.')
      setFilas(body.miembros || [])
    } catch (err) {
      setError(errorMessage(err, 'No se pudo cargar el historial de correos.'))
    } finally {
      setLoading(false)
    }
  }, [mostrar])

  useEffect(() => {
    // Carga al abrir el bloque y al cambiar entre correos ocultos y visibles
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs ${subtle}`}>
          Un correo «sin respuesta» se envió después de la última vez que la persona entró a la app. No muestra si lo abrió.
        </p>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 min-h-10 px-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Actualizar
        </button>
      </div>

      {loading && !filas && (
        <p className={`text-sm ${subtle} flex items-center gap-2`}>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Cargando…
        </p>
      )}
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {filas && filas.length === 0 && <Empty>No hay miembros con acceso.</Empty>}

      {filas && filas.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {filas.map((f, i) => (
            <li key={`${f.correo}-${i}`} className="py-3 flex items-start gap-3">
              <Avatar label={f.quien.slice(0, 2)} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{mostrar ? f.quien : `Miembro ${f.quien}`}</p>
                  <Pill tone={ESTADO_TONE[f.estado] || 'info'}>{ESTADO_LABEL[f.estado] || f.estado}</Pill>
                  <Pill tone={TONO[f.veredicto.tono]}>{TONO_TEXTO[f.veredicto.tono]}</Pill>
                </div>
                {mostrar && <p className={`text-xs ${subtle} truncate`}>{f.correo}</p>}
                <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">{f.veredicto.texto}</p>
                <p className={`text-xs ${subtle}`}>
                  {f.diasSinEntrar === null ? 'Nunca ha entrado' : `${f.diasSinEntrar} días sin entrar`}
                  {f.contactadoEl ? ` · contactado por ti el ${fecha(f.contactadoEl)}${f.canalContacto ? ` por ${CANAL[f.canalContacto] || f.canalContacto}` : ''}` : ''}
                </p>
                {f.enviados.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {f.enviados.map((e) => (
                      <li key={`${e.tipo}-${e.en}`} className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                        {`${fecha(e.en)} · `}
                        <span className="font-semibold">{KIND_LABEL[e.tipo] || e.tipo}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
