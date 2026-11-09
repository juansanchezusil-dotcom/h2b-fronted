'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

// Bloque desplegable para las herramientas de detalle: el contenido solo se monta (y carga datos) al abrirlo
export default function Collapsible({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <span>
          <span className="block text-base font-bold text-slate-800 dark:text-white">{title}</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
        </span>
        <ChevronDown className={`w-5 h-5 shrink-0 text-slate-400 motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && <div className="px-4 pb-4 space-y-6">{children}</div>}
    </section>
  )
}
