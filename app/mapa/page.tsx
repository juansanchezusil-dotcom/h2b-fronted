'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import LogoMark from '@/components/LogoMark'
import { buildMap } from '@/lib/h2bMap'

// Mapa H2B público: sin cuenta. Cinco preguntas, el correo (con consentimiento) y el mapa en pantalla.
// Usa la misma lógica que Mi Mapa de los miembros (lib/h2bMap.ts), solo que sin CRM ni datos guardados.
const BACKEND = 'https://h2b-backend-three.vercel.app'

type Experience = 'directa' | 'parecida' | 'informal' | 'ninguna' | ''
type YesNo = 'si' | 'no' | 'no_se' | ''

interface Answers {
  role: string
  experience: Experience
  english: '' | 'Básico' | 'Intermedio' | 'Avanzado'
  hasCv: YesNo
  passport: YesNo
}

const EMPTY: Answers = { role: '', experience: '', english: '', hasCv: '', passport: '' }

const ROLE_CHIPS = ['Housekeeper', 'Cocina', 'Construcción', 'Jardinería (Landscaping)', 'Front desk', 'Mesero', 'Lavaplatos', 'Conductor']

const QUESTIONS: { key: keyof Answers; title: string; hint?: string }[] = [
  { key: 'role', title: '¿A qué puesto o industria quieres postular?', hint: 'Elige uno o escribe el tuyo.' },
  { key: 'experience', title: '¿Tienes experiencia en ese tipo de trabajo?' },
  { key: 'english', title: '¿Cómo está tu inglés?', hint: 'Sé honesto: esto ayuda a darte un mejor mapa.' },
  { key: 'hasCv', title: '¿Ya tienes un CV en inglés?' },
  { key: 'passport', title: '¿Tu pasaporte está vigente?', hint: 'Idealmente con 6 meses o más de vigencia.' },
]

const OPTIONS: Partial<Record<keyof Answers, { value: string; label: string }[]>> = {
  experience: [
    { value: 'directa', label: 'Sí, he trabajado en ese puesto' },
    { value: 'parecida', label: 'En algo parecido' },
    { value: 'informal', label: 'Ayudé a familiares o hice trabajos informales' },
    { value: 'ninguna', label: 'Todavía no' },
  ],
  english: [
    { value: 'Básico', label: 'Básico' },
    { value: 'Intermedio', label: 'Intermedio' },
    { value: 'Avanzado', label: 'Avanzado o fluido' },
  ],
  hasCv: [
    { value: 'si', label: 'Sí' },
    { value: 'no', label: 'No' },
  ],
  passport: [
    { value: 'si', label: 'Sí' },
    { value: 'no', label: 'No' },
    { value: 'no_se', label: 'No estoy seguro' },
  ],
}

const ROUTE_BY_EXPERIENCE = { directa: 'A', parecida: 'B', informal: 'C', ninguna: '', '': '' } as const

const card = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm'
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#C89B3C] hover:bg-[#b08833] disabled:opacity-50 text-[#08131F] font-bold text-sm px-5 py-3 transition'

export default function MapaPublico() {
  const [step, setStep] = useState(0) // 0-4 preguntas, 5 correo, 6 mapa
  const [a, setA] = useState<Answers>(EMPTY)
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('') // campo trampa para programas
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const map = useMemo(
    () =>
      buildMap({
        profile: {
          targetRole: a.role,
          industry: a.role,
          englishLevel: a.english,
          country: '',
          cvRoute: ROUTE_BY_EXPERIENCE[a.experience] as '' | 'A' | 'B' | 'C',
          perfilCompletado: !!a.role,
        },
        hasCv: a.hasCv === 'si',
        crm: [],
        steps: { passport: a.passport === 'si', ds160: false },
        dia: null,
        applied30: 0,
        now: Date.now(),
      }),
    [a]
  )

  const q = QUESTIONS[step]
  const answered = step < QUESTIONS.length && !!a[q.key]

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!consent) {
      setError('Marca la casilla para poder enviarte tu mapa.')
      return
    }
    setSending(true)
    try {
      const res = await fetch(`${BACKEND}/api/mapa/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre, consent, website, answers: a, stage: map.currentStage }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No pudimos guardar tu correo. Intenta de nuevo.')
      setStep(6)
    } catch (err: any) {
      setError(err.message || 'No pudimos guardar tu correo. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-slate-950 px-4 py-8">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <header className="flex items-center gap-3">
          <LogoMark size={44} decorative className="rounded-xl" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#08131F] dark:text-white">Juan Te Avisa</p>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Mi Mapa H2B Personal</h1>
          </div>
        </header>

        {step < 5 && (
          <section className={`${card} space-y-4`} aria-live="polite">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{`Pregunta ${step + 1} de 5`}</p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{q.title}</h2>
            {q.hint && <p className="text-xs text-slate-500 dark:text-slate-400">{q.hint}</p>}

            {q.key === 'role' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {ROLE_CHIPS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setA({ ...a, role: c })}
                      aria-pressed={a.role === c}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        a.role === c
                          ? 'border-[#C89B3C] bg-amber-50 dark:bg-amber-500/10 text-[#08131F] dark:text-amber-300'
                          : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  maxLength={80}
                  value={a.role}
                  onChange={(e) => setA({ ...a, role: e.target.value })}
                  placeholder="O escribe tu puesto"
                  aria-label="Puesto o industria"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
                />
              </div>
            ) : (
              <div className="grid gap-2" role="group" aria-label={q.title}>
                {(OPTIONS[q.key] || []).map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={a[q.key] === o.value}
                    onClick={() => setA({ ...a, [q.key]: o.value } as Answers)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      a[q.key] === o.value
                        ? 'border-[#C89B3C] bg-amber-50 dark:bg-amber-500/10 text-[#08131F] dark:text-amber-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 disabled:opacity-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Atrás
              </button>
              <button type="button" onClick={() => setStep(step + 1)} disabled={!answered || (q.key === 'role' && !a.role.trim())} className={primaryBtn}>
                {step === 4 ? 'Ver mi mapa' : 'Siguiente'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {step === 5 && (
          <form onSubmit={submit} className={`${card} space-y-4`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tu mapa está listo</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Déjame tu correo para mostrártelo y para escribirte cuando haya algo útil para tu búsqueda, como la masterclass.
            </p>
            <input
              type="text"
              maxLength={80}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre (opcional)"
              aria-label="Tu nombre"
              autoComplete="given-name"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
            />
            <input
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              aria-label="Tu correo"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
            />
            {/* Campo trampa: oculto para las personas */}
            <div className="hidden" aria-hidden="true">
              <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#C89B3C]" />
              <span>
                Acepto que Juan Te Avisa me escriba a este correo sobre mi mapa y sobre la masterclass. Puedo pedir que dejen de escribirme cuando quiera.
                Más información en la{' '}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline">
                  política de privacidad
                </a>
                .
              </span>
            </label>
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep(4)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <ArrowLeft className="w-3.5 h-3.5" /> Atrás
              </button>
              <button type="submit" disabled={sending} className={primaryBtn}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Ver mi mapa
              </button>
            </div>
          </form>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <section className={`${card} space-y-3`}>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{map.headline}</h2>
              <ol className="grid grid-cols-5 gap-1.5" aria-label="Tus 5 etapas">
                {map.stages.map((s, i) => (
                  <li
                    key={s.id}
                    className={`rounded-lg px-1 py-2 text-center text-[11px] font-bold ${
                      s.state === 'current'
                        ? 'bg-[#C89B3C] text-[#08131F]'
                        : s.state === 'done'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span className="block text-sm">{s.state === 'done' ? '✓' : i + 1}</span>
                    {s.label}
                  </li>
                ))}
              </ol>
              {map.route && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-800 dark:text-slate-100">{map.route.label}.</strong> {map.route.explanation}
                </p>
              )}
              {map.englishNote && (
                <p className="text-xs text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-3.5 py-3">{map.englishNote}</p>
              )}
            </section>

            {map.nextSteps.length > 0 && (
              <section className={`${card} space-y-3`}>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Lo que sigue</h2>
                <ul className="space-y-3">
                  {map.nextSteps.map((s) => (
                    <li key={s.id} className="flex gap-3">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#C89B3C]" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className={`${card} space-y-3`}>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Tus primeros 30 días</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {`Para ${map.goal.label}, una guía razonable es de unas ${map.goal.perWeek} postulaciones por semana a empresas distintas, ya verificadas.`}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {map.plan.map((w) => (
                  <div key={w.week} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{`Semana ${w.week}: ${w.title}`}</p>
                    <ul className="mt-1.5 space-y-1">
                      {w.items.map((it) => (
                        <li key={it.label} className="flex gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span aria-hidden="true">{it.done ? '✓' : '○'}</span>
                          <span>{it.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Este mapa organiza tu búsqueda con lo que respondiste. No garantiza visa, patrocinio, entrevistas ni contratación: eso depende de cada empresa. Juan Te Avisa no es agencia ni despacho de abogados.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
