'use client'

import { useEffect, useState } from 'react'
import { BookmarkPlus, Check, ExternalLink, Radio } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface ClassOffer {
  id: string
  job_title: string
  company_name: string
  state: string | null
  url: string | null
  note: string | null
}

interface ClassOffersProps {
  // Guarda la oferta en el CRM de la persona como "guardada". Devuelve true si quedó guardada.
  onSave: (company: string, role: string, state?: string) => Promise<boolean>
}

// Ofertas que Juan encuentra en vivo en la clase. Se leen directo de la base (solo las activas) y cada
// persona decide cuáles guardar en su CRM; verificarlas con los 4 puntos sigue siendo trabajo de cada quien.
export default function ClassOffers({ onSave }: ClassOffersProps) {
  const [offers, setOffers] = useState<ClassOffer[] | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('class_offers')
        .select('id, job_title, company_name, state, url, note')
        .order('created_at', { ascending: false })
        .limit(30)
      if (!cancelled) setOffers(error ? [] : data || [])
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Sin ofertas (o sin acceso a la tabla todavía) no se muestra nada: no ocupa espacio ni confunde
  if (!offers || offers.length === 0) return null

  const save = async (o: ClassOffer) => {
    setBusy(o.id)
    const ok = await onSave(o.company_name, o.job_title, o.state || undefined)
    setBusy(null)
    // Si ya estaba en el CRM, addToCRM avisa con un mensaje y devuelve false: aquí también cuenta como guardada
    setSaved((prev) => new Set(prev).add(o.id))
    return ok
  }

  return (
    <section aria-labelledby="mapa-clase" className="space-y-3">
      <div>
        <h2 id="mapa-clase" className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Radio className="w-4 h-4 text-[#C89B3C]" aria-hidden="true" /> Ofertas de la clase
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Las que encontramos juntos. Guárdalas en tu CRM y pásalas por los 4 puntos de verificación antes de postular. Que aparezcan aquí no significa que te vayan a responder.
        </p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {offers.map((o) => (
          <li key={o.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{o.job_title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{`${o.company_name}${o.state ? ` · ${o.state}` : ''}`}</p>
            </div>
            {o.note && <p className="text-xs text-slate-600 dark:text-slate-300">{o.note}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => save(o)}
                disabled={busy === o.id || saved.has(o.id)}
                className="flex items-center gap-1.5 rounded-lg bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5"
              >
                {saved.has(o.id) ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                {saved.has(o.id) ? 'En tu CRM' : 'Guardar en mi CRM'}
              </button>
              {o.url && /^https?:\/\//i.test(o.url) && (
                <a href={o.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold text-[#0B4079] dark:text-[#C89B3C] hover:underline">
                  Ver oferta <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
