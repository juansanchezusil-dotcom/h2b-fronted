'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'

interface Lead {
  email: string
  nombre: string | null
  role: string | null
  stage: string | null
  answers: { experience?: string; english?: string; hasCv?: string; passport?: string } | null
  updated_at: string
  unsubscribed_at?: string | null
  reminder_sent_at?: string | null
  skip_reminder?: boolean
}

const STAGE: Record<string, string> = {
  prepare: 'Prepárate',
  search: 'Búscalas',
  apply: 'Postula',
  followup: 'Seguimiento',
  interview: 'Entrevista',
}

const EXPERIENCE: Record<string, string> = { directa: 'Directa', parecida: 'Parecida', informal: 'Informal', ninguna: 'Ninguna' }

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })

// Panel del administrador: quién dejó su correo en el Mapa público, con lo que respondió
export default function MapLeadsPanel() {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [armed, setArmed] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [pasted, setPasted] = useState('')

  const reload = async () => {
    const res = await aiFetch('/api/admin/mapa-leads')
    const data = await res.json().catch(() => ({}))
    if (res.ok) setLeads(data.leads)
  }

  const exclude = async () => {
    const emails = Array.from(new Set((pasted.match(/[^\s,;<>"']+@[^\s,;<>"']+\.[^\s,;<>"']{2,}/g) || []).map((e) => e.toLowerCase())))
    if (!emails.length) {
      setError('No encontramos correos en lo que pegaste.')
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const res = await aiFetch('/api/admin/mapa-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'excluir', emails }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar.')
      setNotice(`Pegaste ${data.recibidos} correos; ${data.coinciden} estaban en esta lista y ya no recibirán el recordatorio.`)
      setPasted('')
      await reload()
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar.')
    } finally {
      setBusy(false)
    }
  }

  const act = async (accion: 'prueba' | 'enviar') => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const res = await aiFetch('/api/admin/mapa-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo completar la acción.')
      if (accion === 'prueba') setNotice(`Te mandamos una prueba a ${data.to}. Revisa también el spam.`)
      else {
        setNotice(
          `Enviado a ${data.sent} ${data.sent === 1 ? 'persona' : 'personas'}${data.failed?.length ? `. Fallaron: ${data.failed.length}` : ''}${data.restantes ? '. Quedan más: vuelve a pulsar.' : '.'}`
        )
        await reload()
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo completar la acción.')
    } finally {
      setBusy(false)
      setArmed(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await aiFetch('/api/admin/mapa-leads')
      const data = await res.json().catch(() => ({}))
      if (cancelled) return
      if (!res.ok) setError(data.error || 'No se pudo cargar la lista.')
      else setLeads(data.leads)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const copyEmails = async () => {
    if (!leads?.length) return
    try {
      await navigator.clipboard.writeText(leads.map((l) => l.email).join(', '))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copia los correos:', leads.map((l) => l.email).join(', '))
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Todas estas personas aceptaron que les escribas sobre su mapa y la masterclass. Cada correo que les envíes trae su enlace de baja, y quien se da de baja no vuelve a recibirlos.
      </p>
      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</p>
      )}
      {!leads && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
        </div>
      )}
      {leads && (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {`Recordatorio de la masterclass del 25 de noviembre: ${leads.filter((l) => !l.unsubscribed_at && !l.reminder_sent_at && !l.skip_reminder).length} por enviar, ${leads.filter((l) => l.reminder_sent_at).length} ya enviados, ${leads.filter((l) => l.skip_reminder).length} excluidos (ya en la masterclass), ${leads.filter((l) => l.unsubscribed_at).length} de baja.`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => act('prueba')} disabled={busy} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50">
                Enviarme una prueba
              </button>
              {armed ? (
                <>
                  <button type="button" onClick={() => act('enviar')} disabled={busy} className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                    Sí, enviar ahora
                  </button>
                  <button type="button" onClick={() => setArmed(false)} className="text-xs font-semibold text-slate-500 dark:text-slate-400 underline">
                    Cancelar
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setArmed(true)} disabled={busy} className="rounded-lg bg-[#0B4079] hover:bg-[#08305c] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                  Enviar recordatorio a los que faltan
                </button>
              )}
            </div>
            <div className="space-y-1.5 pt-1">
              <label htmlFor="excluir-correos" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                ¿Ya están registrados en la masterclass? Pega sus correos para no duplicarles el mensaje
              </label>
              <textarea
                id="excluir-correos"
                rows={3}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="correo1@ejemplo.com, correo2@ejemplo.com"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-xs"
              />
              <button type="button" onClick={exclude} disabled={busy || !pasted.trim()} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50">
                Excluir del recordatorio
              </button>
            </div>
            {notice && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">{notice}</p>}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{`${leads.length} ${leads.length === 1 ? 'contacto' : 'contactos'}`}</p>
            <button
              type="button"
              onClick={copyEmails}
              disabled={!leads.length}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copiados' : 'Copiar todos los correos'}
            </button>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            {leads.length === 0 && <li className="p-4 text-sm text-slate-500 dark:text-slate-400">Todavía nadie dejó su correo.</li>}
            {leads.map((l) => (
              <li key={l.email} className="p-4 space-y-0.5">
                <p className="text-sm font-semibold text-slate-800 dark:text-white break-all">{l.nombre ? `${l.nombre} · ${l.email}` : l.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {[
                    l.role,
                    l.stage ? `Etapa: ${STAGE[l.stage] || l.stage}` : '',
                    l.answers?.experience ? `Experiencia: ${EXPERIENCE[l.answers.experience] || l.answers.experience}` : '',
                    l.answers?.english ? `Inglés: ${l.answers.english}` : '',
                    l.answers?.hasCv === 'no' ? 'Sin CV' : '',
                    l.answers?.passport === 'no' ? 'Sin pasaporte' : '',
                    l.unsubscribed_at ? 'De baja' : l.reminder_sent_at ? 'Recordatorio enviado' : l.skip_reminder ? 'Excluido (ya en la masterclass)' : '',
                    fecha(l.updated_at),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
