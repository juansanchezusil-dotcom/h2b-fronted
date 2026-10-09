'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Mail, Check, X as XIcon, Send } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'

type Mode = 'off' | 'test' | 'on'

interface EngagementData {
  mode: Mode
  replyToConfigured: boolean
  renewalLinkConfigured: boolean
  planned: { email: string; kind: string }[]
  recent: { email: string; kind: string; at: string }[]
  rules: { reengageAfterDays: number; reengageGapDays: number; reengageMaxUnanswered: number; skipIfContactedReengageDays: number }
}

const KIND_LABEL: Record<string, string> = {
  reengage: 'Reenganche',
  renewal_7: 'Renovación (7 días)',
  renewal_3: 'Renovación (3 días)',
  renewal_after: 'Acceso vencido',
  reto_30: 'Reto de 30 días',
}

const MODE: Record<Mode, { label: string; detail: string; badge: string }> = {
  off: {
    label: 'Apagados',
    detail: 'No se envía ningún correo a los miembros.',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  },
  test: {
    label: 'En prueba',
    detail: 'Los correos se calculan como siempre, pero llegan solo a tu correo (máximo 5 por día), con el nombre de a quién irían.',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
  },
  on: {
    label: 'Activos',
    detail: 'Se envían a los miembros y queda registro para no repetirlos.',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
}

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })

function Item({ ok, children }: { ok: boolean | null; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
      {ok === null ? (
        <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-slate-300 dark:border-slate-600" aria-hidden="true" />
      ) : ok ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
      ) : (
        <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
      )}
      <span>{children}</span>
    </li>
  )
}

export default function EngagementPanel() {
  const [data, setData] = useState<EngagementData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiFetch('/api/admin/engagement')
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'No se pudo cargar el estado de los correos.')
      setData(body)
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el estado de los correos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sendSamples = async () => {
    setSending(true)
    setResult(null)
    setError(null)
    try {
      const res = await aiFetch('/api/admin/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'muestras' }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'No se pudieron enviar los ejemplos.')
      setResult(
        body.failed?.length
          ? `Se enviaron ${body.sent} a ${body.to}. Fallaron: ${body.failed.join(', ')}.`
          : `Listo: enviamos ${body.sent} correos de ejemplo a ${body.to}. Revisa también la carpeta de spam.`
      )
    } catch (err: any) {
      setError(err.message || 'No se pudieron enviar los ejemplos.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section aria-labelledby="correos-titulo" className="space-y-3">
      <div>
        <h2 id="correos-titulo" className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
          <Mail className="w-5 h-5 text-[#C89B3C]" aria-hidden="true" /> Correos automáticos
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Renovación para quien está por vencer y reenganche para quien se enfría. Los recordatorios de seguimiento 7-14-21 son aparte y no dependen de esto.
        </p>
      </div>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading && !data && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
        </div>
      )}

      {data && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 ${MODE[data.mode].badge}`}>{MODE[data.mode].label}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{MODE[data.mode].detail}</span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Antes de encenderlos</h3>
            <ul className="mt-2 space-y-1.5">
              <Item ok={null}>{'Política de privacidad en /privacidad (ya publicada): que tu abogado la revise antes de encender.'}</Item>
              <Item ok={data.replyToConfigured}>
                {`Dirección donde lees las respuestas${data.replyToConfigured ? '' : ': falta la variable ENGAGEMENT_REPLY_TO en Vercel. Sin ella no se envía a miembros'}.`}
              </Item>
              <Item ok={data.renewalLinkConfigured}>
                {`Enlace de renovación${data.renewalLinkConfigured ? '' : ': falta NEXT_PUBLIC_MEMBERSHIP_URL. Mientras tanto los correos piden responder para renovar'}.`}
              </Item>
              <Item ok={null}>Aprobaste los textos: pulsa el botón de abajo y revisa los ejemplos en tu correo.</Item>
            </ul>
            <button
              type="button"
              onClick={sendSamples}
              disabled={sending}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviarme los correos de ejemplo
            </button>
            {result && (
              <p role="status" className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                {result}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Hoy se le escribiría a</h3>
            {data.planned.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Nadie hoy.</p>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {data.planned.map((p) => (
                  <li key={`${p.kind}-${p.email}`} className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">{KIND_LABEL[p.kind] || p.kind}</span>
                    {` · ${p.email}`}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {data.recent.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Últimos enviados</h3>
              <ul className="mt-1.5 space-y-1">
                {data.recent.map((r) => (
                  <li key={`${r.kind}-${r.email}-${r.at}`} className="text-xs text-slate-600 dark:text-slate-300">
                    {`${fecha(r.at)} · `}
                    <span className="font-semibold">{KIND_LABEL[r.kind] || r.kind}</span>
                    {` · ${r.email}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
            <p>
              {`Reglas: el reenganche empieza a los ${data.rules.reengageAfterDays} días sin entrar, máximo uno cada ${data.rules.reengageGapDays} días, y se detiene tras ${data.rules.reengageMaxUnanswered} sin que la persona vuelva. No se escribe a quien se dio de baja ni a quien marcaste como contactado hace menos de ${data.rules.skipIfContactedReengageDays} días.`}
            </p>
            <p>
              {'Para cambiar el modo, edita la variable ENGAGEMENT_EMAILS en Vercel (off, test u on) y vuelve a desplegar el backend.'}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
