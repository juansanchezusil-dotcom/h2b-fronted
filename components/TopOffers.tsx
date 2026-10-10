'use client'

import { useEffect, useState } from 'react'
import { BookmarkPlus, Check, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface TopJob {
  id: string
  title: string
  employer_name: string
  location: string | null
  score: number
}

interface TopOffersProps {
  perfilCompletado: boolean
  // Guarda la oferta en el CRM de la persona. Devuelve true si quedó guardada.
  onSave: (company: string, role: string, state?: string) => Promise<boolean>
  onSeeAll: () => void
  // Abre el detalle de la oferta (la misma ventana que en la lista de ofertas)
  onOpen: (jobId: string) => void
}

// Las 3 ofertas que mejor encajan con el perfil de la persona, según el cálculo que ya usa la lista de
// ofertas (industria, experiencia e inglés). No dice que la empresa vaya a responder.
export default function TopOffers({ perfilCompletado, onSave, onSeeAll, onOpen }: TopOffersProps) {
  const [jobs, setJobs] = useState<TopJob[] | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!perfilCompletado) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/jobs/matches')
        if (!res.ok) return
        const rows: { job_id: string | number; match_score: number }[] = await res.json()
        const top = rows
          .filter((r) => typeof r.match_score === 'number' && r.match_score > 0)
          .sort((a, b) => b.match_score - a.match_score)
          .slice(0, 3)
        if (!top.length) return
        const { data } = await supabase
          .from('jobs')
          .select('id, title, employer_name, location')
          .in('id', top.map((r) => r.job_id))
        if (cancelled || !data) return
        const byId = new Map<string, { id: string; title: string; employer_name: string; location: string | null }>(data.map((j: any) => [String(j.id), j]))
        const list: TopJob[] = top
          .map((r) => {
            const j = byId.get(String(r.job_id))
            return j ? { id: String(j.id), title: j.title, employer_name: j.employer_name, location: j.location, score: r.match_score } : null
          })
          .filter((j): j is TopJob => j !== null)
        setJobs(list)
      } catch {
        // Sin las sugerencias el Mapa funciona igual
      }
    })()
    return () => {
      cancelled = true
    }
  }, [perfilCompletado])

  if (!jobs || jobs.length === 0) return null

  const save = async (j: TopJob) => {
    setBusy(j.id)
    await onSave(j.employer_name, j.title, j.location || undefined)
    setBusy(null)
    // Si ya estaba en el CRM, la app lo avisa con un mensaje; aquí también cuenta como guardada
    setSaved((prev) => new Set(prev).add(j.id))
  }

  return (
    <section aria-labelledby="mapa-top" className="space-y-3">
      <div>
        <h2 id="mapa-top" className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Sparkles className="w-4 h-4 text-[#C89B3C]" aria-hidden="true" /> Tus 3 mejores ofertas
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Las que más encajan con tu perfil. Verifica cada una antes de postular: encajar no significa que te vayan a responder.
        </p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {jobs.map((j) => (
          <li key={j.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col gap-2">
            <button type="button" onClick={() => onOpen(j.id)} className="text-left space-y-0.5 group">
              <span className="block text-sm font-bold text-slate-900 dark:text-white group-hover:underline">{j.title}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{`${j.employer_name}${j.location ? ` · ${j.location}` : ''}`}</span>
            </button>
            <span className="w-fit rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {`${j.score}% compatible`}
            </span>
            <button type="button" onClick={() => onOpen(j.id)} className="text-xs font-semibold text-[#0B4079] dark:text-[#C89B3C] hover:underline text-left">
              Ver la oferta completa
            </button>
            <button
              type="button"
              onClick={() => save(j)}
              disabled={busy === j.id || saved.has(j.id)}
              className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-60 text-white text-xs font-bold px-3 py-2"
            >
              {saved.has(j.id) ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
              {saved.has(j.id) ? 'En tu CRM' : 'Guardar en mi CRM'}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onSeeAll} className="text-xs font-semibold text-[#0B4079] dark:text-[#C89B3C] hover:underline">
        Ver todas las ofertas
      </button>
    </section>
  )
}
