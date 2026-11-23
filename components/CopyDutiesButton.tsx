'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { copyText } from '@/lib/jobDuties'

// Copia las funciones de la oferta para pegarlas en el simulador, el redactor de correo u otro asistente.
export default function CopyDutiesButton({ duties, label = false }: { duties: string; label?: boolean }) {
  const [copied, setCopied] = useState(false)
  if (!duties) return null
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation() // en la tarjeta no debe abrir el detalle
        if (await copyText(duties)) {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
      }}
      onKeyDown={(e) => e.stopPropagation()}
      title="Copiar las funciones de la oferta"
      aria-label={copied ? 'Funciones copiadas' : 'Copiar las funciones de la oferta'}
      className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span>{copied ? 'Copiado' : 'Copiar funciones'}</span>}
    </button>
  )
}
