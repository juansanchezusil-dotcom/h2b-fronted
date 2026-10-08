'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, Target } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { COMMITMENT_DAYS, COMMITMENT_GOAL, computeNotices, type Notices } from '@/lib/membershipNotices'

// Enlace para renovar, configurable en Vercel sin tocar código (el mismo que usa la pantalla de sin acceso)
const MEMBERSHIP_URL = process.env.NEXT_PUBLIC_MEMBERSHIP_URL

const DAY = 24 * 60 * 60 * 1000

export function NoticesView({ notices, renewUrl }: { notices: Notices; renewUrl?: string }) {
  const pct = Math.min(100, Math.round((notices.postulaciones / COMMITMENT_GOAL) * 100))
  const enCurso = notices.dia !== null && notices.dia < COMMITMENT_DAYS

  return (
    <div className="space-y-3">
      {notices.mostrarRenovacion && (
        <div
          role="status"
          className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-4"
        >
          <CalendarClock className="w-5 h-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
          <p className="flex-1 text-sm text-amber-900 dark:text-amber-200">
            {notices.venceEn === 0
              ? `Tu acceso a PRO vence hoy (${notices.venceFecha}).`
              : `Tu acceso a PRO vence en ${notices.venceEn} ${notices.venceEn === 1 ? 'día' : 'días'} (${notices.venceFecha}).`}
          </p>
          {renewUrl && (
            <a
              href={renewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl bg-[#C89B3C] px-4 py-2 text-xs font-bold text-[#08131F] hover:bg-[#b08833] transition text-center"
            >
              Renovar
            </a>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#C89B3C]" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tu Compromiso de PRO</h2>
          {enCurso && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              · Día {notices.dia} de {COMMITMENT_DAYS}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex items-center gap-3">
          <div
            className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={COMMITMENT_GOAL}
            aria-valuenow={Math.min(notices.postulaciones, COMMITMENT_GOAL)}
            aria-label="Postulaciones a empresas distintas en los últimos 30 días"
          >
            <div className="h-full bg-[#C89B3C] transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
            {notices.postulaciones} de {COMMITMENT_GOAL}
          </span>
        </div>
        {/* Una sola cadena: con expresiones seguidas de texto en varias líneas el compilador se comía el espacio */}
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {`Para la revisión de tu caso a los ${COMMITMENT_DAYS} días cuentan: perfil completo, CV hecho y ${COMMITMENT_GOAL} postulaciones a empresas distintas. Se registran cuando postulas desde la app o mueves una oferta fuera de “guardadas”.`}
        </p>
      </div>
    </div>
  )
}

// Dos avisos para la persona, debajo de "Tu prioridad": cuánto lleva de su Compromiso de PRO y, solo
// cuando faltan 7 días o menos, que su acceso está por vencer. Son datos reales, sin urgencia inventada.
export default function MembershipNotices({ userId }: { userId: string }) {
  const [notices, setNotices] = useState<Notices | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      const email = auth.user?.email?.trim().toLowerCase()
      if (!email) return
      const since = new Date(Date.now() - COMMITMENT_DAYS * DAY).toISOString()
      const [acceso, eventos] = await Promise.all([
        supabase.from('accesos').select('created_at, vence_el').eq('email', email).maybeSingle(),
        supabase
          .from('application_events')
          .select('company_name, from_status, to_status, created_at')
          .eq('user_id', userId)
          .gte('created_at', since),
      ])
      // Si algo falla no se muestra nada: es un aviso de apoyo, no algo que la persona necesite para usar la app
      if (cancelled || acceso.error || eventos.error) return
      setNotices(computeNotices(acceso.data, eventos.data || [], Date.now()))
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  if (!notices) return null
  return <NoticesView notices={notices} renewUrl={MEMBERSHIP_URL} />
}
