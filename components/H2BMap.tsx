'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  Mic,
  Search,
  Send,
  ShieldAlert,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { buildMap, type RouteCode, type StageId, type StepAction } from '@/lib/h2bMap'
import TopOffers from '@/components/TopOffers'
import { loadSteps, saveStepsRemote, writeChecklistSteps, type ManualSteps } from '@/lib/checklistSteps'
import { useMembershipNotices } from '@/hooks/useMembershipNotices'

interface H2BMapProps {
  userId: string
  hasCv: boolean
  perfilCompletado: boolean
  crmItems: { status: string; createdAt: number }[]
  onEditProfile: () => void
  onOpenCvBuilder: () => void
  onNavigateToTab: (tab: string) => void
  onOpenInterview: () => void
  onOpenScamDetector: () => void
  // Guarda una oferta sugerida en el CRM de la persona
  onSaveOffer: (company: string, role: string, state?: string) => Promise<boolean>
}

interface ProfileRow {
  targetRole: string
  industry: string
  englishLevel: string
  country: string
  cvRoute: RouteCode
}

const STAGE_ICONS: Record<StageId, LucideIcon> = {
  prepare: UserCheck,
  search: Search,
  apply: Send,
  followup: Clock,
  interview: Mic,
}

const EMPTY_PROFILE: ProfileRow = { targetRole: '', industry: '', englishLevel: '', country: '', cvRoute: '' }

export default function H2BMap({
  userId,
  hasCv,
  perfilCompletado,
  crmItems,
  onEditProfile,
  onOpenCvBuilder,
  onNavigateToTab,
  onOpenInterview,
  onOpenScamDetector,
  onSaveOffer,
}: H2BMapProps) {
  const [profile, setProfile] = useState<ProfileRow>(EMPTY_PROFILE)
  const [steps, setSteps] = useState<ManualSteps>({ passport: false, ds160: false })
  const notices = useMembershipNotices(userId)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    loadSteps(supabase, userId).then((s) => {
      if (!cancelled) setSteps(s)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('target_role, industry, experiencia_industria, english_level, nivel_ingles, pais_origen, cv_route')
        .eq('id', userId)
        .maybeSingle()
      if (cancelled || !data) return
      setProfile({
        targetRole: data.target_role || '',
        industry: data.industry || data.experiencia_industria || '',
        englishLevel: data.english_level || data.nivel_ingles || '',
        country: data.pais_origen || '',
        cvRoute: data.cv_route === 'A' || data.cv_route === 'B' || data.cv_route === 'C' ? data.cv_route : '',
      })
    })()
    return () => {
      cancelled = true
    }
  }, [userId, hasCv])

  const togglePlan = (id: string) => {
    setSteps((prev) => {
      const next: ManualSteps = { ...prev, plan: { ...(prev.plan || {}), [id]: !prev.plan?.[id] } }
      if (userId) {
        writeChecklistSteps(userId, next)
        saveStepsRemote(supabase, userId, next)
      }
      return next
    })
  }

  const toggleStep = (key: 'passport' | 'ds160') => {
    setSteps((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (userId) {
        writeChecklistSteps(userId, next)
        saveStepsRemote(supabase, userId, next)
      }
      return next
    })
  }

  // Sin los datos del Compromiso (todavía cargando), las postulaciones se estiman con el CRM
  const appliedFallback = crmItems.filter((i) => i.status !== 'guardadas').length
  const map = useMemo(
    () =>
      buildMap({
        profile: { ...profile, perfilCompletado },
        hasCv,
        crm: crmItems,
        steps,
        manualPlan: steps.plan,
        dia: notices?.dia ?? null,
        applied30: notices ? notices.postulaciones : appliedFallback,
        now: Date.now(),
      }),
    [profile, perfilCompletado, hasCv, crmItems, steps, notices, appliedFallback]
  )

  const run = (action: StepAction) => {
    switch (action) {
      case 'profile':
        return onEditProfile()
      case 'cv':
        return onOpenCvBuilder()
      case 'jobs':
        return onNavigateToTab('jobs')
      case 'crm':
        return onNavigateToTab('crm')
      case 'interview':
        return onOpenInterview()
      case 'passport':
        return toggleStep('passport')
      case 'scam':
        return onOpenScamDetector()
    }
  }

  const pct = Math.round((map.progress.done / map.progress.total) * 100)
  const chips = [profile.targetRole, profile.industry, profile.country, profile.englishLevel && `Inglés ${profile.englishLevel.toLowerCase()}`].filter(
    Boolean
  ) as string[]

  const stats = [
    { label: 'Guardadas', value: map.stats.guardadas },
    { label: 'Postuladas', value: map.stats.postuladas },
    { label: 'En seguimiento', value: map.stats.seguimiento },
    { label: 'Entrevistas', value: map.stats.entrevistas },
  ]

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Encabezado: quién eres y cuánto llevas */}
      <div className="rounded-2xl bg-[#08131F] text-white p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-[#C89B3C] bg-[#C89B3C]/15 border border-[#C89B3C]/30 rounded-full px-3 py-1">
              <Compass className="w-3.5 h-3.5" aria-hidden="true" /> Mi Mapa H2B
            </p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Dónde estás y qué sigue</h1>
            <p className="text-sm text-slate-400">Se calcula con tus datos reales: tu perfil, tu CV y tu seguimiento.</p>
            {chips.length > 0 && (
              <ul className="flex flex-wrap gap-2 pt-1">
                {chips.map((c) => (
                  <li key={c} className="text-xs rounded-full bg-white/10 px-2.5 py-1 text-slate-200">
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 px-5 py-4 text-center min-w-[170px]">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Tu preparación</p>
            <p className="text-3xl font-black text-[#C89B3C] tabular-nums">{pct}%</p>
            <p className="text-xs text-slate-400">{`${map.progress.done} de ${map.progress.total} listos`}</p>
          </div>
        </div>
      </div>

      {/* Etapas */}
      <ol aria-label="Etapas de tu búsqueda" className="grid grid-cols-5 gap-1 sm:gap-2">
        {map.stages.map((stage) => {
          const Icon = STAGE_ICONS[stage.id]
          const current = stage.state === 'current'
          const done = stage.state === 'done'
          return (
            <li key={stage.id} aria-current={current ? 'step' : undefined} className="flex flex-col items-center text-center gap-1.5">
              <span
                className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 transition ${
                  current
                    ? 'border-[#C89B3C] bg-[#C89B3C] text-[#08131F] ring-4 ring-[#C89B3C]/25'
                    : done
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400'
                }`}
              >
                {done ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <Icon className="h-5 w-5" aria-hidden="true" />}
              </span>
              <span
                className={`text-[11px] sm:text-xs font-semibold leading-tight ${
                  current ? 'text-slate-900 dark:text-white' : done ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {stage.label}
                <span className="sr-only">{done ? ' (listo)' : current ? ' (etapa actual)' : ' (pendiente)'}</span>
              </span>
            </li>
          )
        })}
      </ol>

      {/* Dónde estás */}
      <section aria-labelledby="mapa-donde" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm space-y-4">
        <h2 id="mapa-donde" className="text-base font-bold text-slate-900 dark:text-white">
          Dónde estás
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{map.headline}</p>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">
              <dt className="text-[11px] text-slate-500 dark:text-slate-400">{s.label}</dt>
              <dd className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Próximos pasos */}
      <section aria-labelledby="mapa-pasos" className="space-y-3">
        <h2 id="mapa-pasos" className="text-base font-bold text-slate-900 dark:text-white">
          Tus próximos pasos
        </h2>
        {map.nextSteps.length === 0 ? (
          <p className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
            Por ahora no tienes pasos pendientes. Sigue explorando ofertas y manteniendo al día tus seguimientos.
          </p>
        ) : (
          <ol className="space-y-3">
            {map.nextSteps.map((step, i) => (
              <li
                key={step.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C89B3C]/15 text-sm font-black text-[#8a6a1f] dark:text-[#C89B3C]"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => run(step.action)}
                  className="shrink-0 rounded-xl bg-[#0B4079] hover:bg-[#08305c] text-white text-xs font-bold px-4 py-2.5 transition"
                >
                  {step.buttonLabel}
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Ruta del CV */}
      {(map.route || map.englishNote) && (
        <section aria-labelledby="mapa-ruta" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm space-y-3">
          <h2 id="mapa-ruta" className="text-base font-bold text-slate-900 dark:text-white">
            Tu perfil de búsqueda
          </h2>
          {map.route && (
            <div className="space-y-1">
              <p className="inline-block rounded-full bg-[#0B4079] text-white text-[11px] font-bold px-2.5 py-0.5">{`Ruta ${map.route.code}: ${map.route.label}`}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{map.route.explanation}</p>
            </div>
          )}
          {map.englishNote && (
            <p className="text-xs text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-3.5 py-3">
              {map.englishNote}
            </p>
          )}
        </section>
      )}

      <TopOffers perfilCompletado={perfilCompletado} onSave={onSaveOffer} onSeeAll={() => onNavigateToTab('jobs')} />

      {/* Plan de 30 días */}
      <section aria-labelledby="mapa-plan" className="space-y-3">
        <div>
          <h2 id="mapa-plan" className="text-base font-bold text-slate-900 dark:text-white">
            Tu plan de 3 semanas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Lo que se puede saber con tus datos se marca solo. Lo demás lo marcas tú cuando lo termines.</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{`Tu primera meta: mínimo 10 empresas distintas, ya verificadas. Para ${map.goal.label} puedes ir por más: unas ${map.goal.perWeek} por semana. Prioriza ofertas verificadas sobre cantidad.`}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {map.plan.map((w) => (
            <div
              key={w.week}
              className={`rounded-2xl border p-4 bg-white dark:bg-slate-900 shadow-sm ${
                w.current ? 'border-[#C89B3C] ring-2 ring-[#C89B3C]/20' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{`Semana ${w.week}: ${w.title}`}</h3>
                {w.current && <span className="text-[11px] font-bold rounded-full bg-[#C89B3C] text-[#08131F] px-2 py-0.5">Estás aquí</span>}
              </div>
              <ul className="mt-2.5 space-y-1.5">
                {w.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    {item.auto ? (
                      item.done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                      )
                    ) : (
                      <input
                        type="checkbox"
                        id={`plan-${item.id}`}
                        checked={item.done}
                        onChange={() => togglePlan(item.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#C89B3C]"
                      />
                    )}
                    <label htmlFor={item.auto ? undefined : `plan-${item.id}`} className={item.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                      {item.label}
                    </label>
                    <span className="sr-only">{item.done ? ' (hecho)' : ' (pendiente)'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Documentos para cuando llegue una oferta */}
      <section aria-labelledby="mapa-docs" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-sm space-y-3">
        <h2 id="mapa-docs" className="text-base font-bold text-slate-900 dark:text-white">
          Para cuando una empresa te confirme
        </h2>
        {(
          [
            { key: 'passport', title: 'Pasaporte vigente', desc: 'Mínimo 6 meses de vigencia a partir del inicio de la temporada.' },
            { key: 'ds160', title: 'Formulario DS-160', desc: 'Se completa cuando el empleador te envíe la petición aprobada (I-797 / ETA-9142B).' },
          ] as const
        ).map((doc) => (
          <button
            key={doc.key}
            type="button"
            role="checkbox"
            aria-checked={steps[doc.key]}
            onClick={() => toggleStep(doc.key)}
            className="flex w-full items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 text-left transition"
          >
            {steps[doc.key] ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            )}
            <span>
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">{doc.title}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{doc.desc}</span>
            </span>
          </button>
        ))}
      </section>

      {/* Anti-estafa */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4">
        <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
        <p className="flex-1 text-xs text-rose-900 dark:text-rose-200">
          Antes de enviar documentos o dinero a alguien, revisa la oferta. En el proceso H-2B legítimo el trabajador no paga por conseguir el empleo.
        </p>
        <button
          type="button"
          onClick={onOpenScamDetector}
          className="shrink-0 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 transition"
        >
          Abrir el Detector de Estafas
        </button>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        Este mapa organiza tu búsqueda con tus datos. No garantiza entrevistas, patrocinio ni contratación: eso depende de cada empresa.
      </p>
    </div>
  )
}
