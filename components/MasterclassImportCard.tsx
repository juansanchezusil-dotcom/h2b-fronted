'use client'

import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import {
  IMPORTED_KEY, MASTERCLASS_KEY, pendingImports, readImportedIds, readMasterclassOffers, type ImportRow,
} from '@/lib/masterclassImport'

type Props = {
  userId: string | null
  crm: { company: string; role: string }[]
  crmReady: boolean
  onImported: (rows: { id: string; company_name: string; job_title: string; status: string; state: string; notes: string; created_at: string }[]) => void
  onToast: (msg: string) => void
}

function markImported(ids: string[]) {
  try {
    const done = readImportedIds(localStorage.getItem(IMPORTED_KEY))
    ids.forEach((id) => done.add(id))
    localStorage.setItem(IMPORTED_KEY, JSON.stringify([...done]))
  } catch {}
}

// Aviso en el inicio: "Tienes N ofertas de la masterclass en este celular. ¿Las pasamos a tu CRM?"
export default function MasterclassImportCard({ userId, crm, crmReady, onImported, onToast }: Props) {
  const [saving, setSaving] = useState(false)
  // Sube cada vez que se pasan o se descartan: vuelve a leer lo guardado en el navegador
  const [version, setVersion] = useState(0)

  const rows = useMemo<ImportRow[]>(() => {
    if (!crmReady || version < 0) return []
    try {
      const offers = readMasterclassOffers(localStorage.getItem(MASTERCLASS_KEY))
      const imported = readImportedIds(localStorage.getItem(IMPORTED_KEY))
      return pendingImports(offers, imported, crm)
    } catch {
      return []
    }
  }, [crm, crmReady, version])

  if (!userId || rows.length === 0) return null

  const postuladas = rows.filter((r) => r.status !== 'guardadas').length

  async function importAll() {
    if (!userId || saving) return
    setSaving(true)
    const { data, error } = await supabase
      .from('applications')
      .insert(rows.map((r) => ({
        user_id: userId,
        company_name: r.company_name,
        job_title: r.job_title,
        state: 'US',
        status: r.status,
        notes: r.notes,
      })))
      .select()
    setSaving(false)
    if (error || !data) {
      console.error('Error pasando ofertas de la masterclass:', error)
      onToast('❌ No se pudieron pasar las ofertas. Intenta de nuevo.')
      return
    }
    markImported(rows.map((r) => r.sourceId))
    onImported(data)
    setVersion((v) => v + 1)
    onToast(`✅ ${data.length} ${data.length === 1 ? 'oferta pasó' : 'ofertas pasaron'} de la masterclass a tu CRM.`)
  }

  function dismiss() {
    markImported(rows.map((r) => r.sourceId))
    setVersion((v) => v + 1)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-4">
      <GraduationCap className="w-5 h-5 shrink-0 text-[#0B4079] dark:text-blue-300" aria-hidden="true" />
      <p className="flex-1 text-sm text-slate-800 dark:text-slate-200">
        {`Tienes ${rows.length} ${rows.length === 1 ? 'oferta' : 'ofertas'} de la masterclass guardadas solo en este navegador${postuladas ? ` (${postuladas} ya ${postuladas === 1 ? 'postulada' : 'postuladas'})` : ''}. Pásalas a tu CRM para no perderlas si cambias de celular.`}
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={dismiss}
          disabled={saving}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          No, gracias
        </button>
        <button
          type="button"
          onClick={importAll}
          disabled={saving}
          className="rounded-xl bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-60 px-4 py-2 text-xs font-bold text-white"
        >
          {saving ? 'Pasando…' : 'Pasar a mi CRM'}
        </button>
      </div>
    </div>
  )
}
