'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'
import { errorMessage } from '@/lib/errors'
import { Empty, Pill, subtle } from './ui'

interface Duda {
  id: string
  created_at: string
  pregunta: string
  respuesta: string
  deriva: boolean
  pantalla: string | null
}

const fecha = (iso: string) => new Date(iso).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Preguntas que los miembros le hicieron a "Pregúntale a Juan", sin nombre ni correo. Se borran a los 90 días.
export default function DudasAsistente() {
  const [dudas, setDudas] = useState<Duda[] | null>(null)
  const [soloDerivadas, setSoloDerivadas] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await aiFetch(`/api/admin/dudas${soloDerivadas ? '?derivadas=1' : ''}`)
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'No se pudieron cargar las dudas.')
      setDudas(body.preguntas || [])
    } catch (err) {
      setError(errorMessage(err, 'No se pudieron cargar las dudas.'))
    } finally {
      setLoading(false)
    }
  }, [soloDerivadas])

  useEffect(() => {
    // Carga al abrir el bloque y al cambiar el filtro
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 min-h-10">
          <input type="checkbox" checked={soloDerivadas} onChange={(e) => setSoloDerivadas(e.target.checked)} />
          Solo las que el asistente mandó a Juan
        </label>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 min-h-10 px-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Actualizar
        </button>
      </div>
      <p className={`text-xs ${subtle}`}>Sin nombre ni correo de quien preguntó. Se borran a los 90 días. Revisa las respuestas para corregir la base de conocimiento.</p>

      {loading && !dudas && (
        <p className={`text-sm ${subtle} flex items-center gap-2`}>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Cargando…
        </p>
      )}
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {dudas && dudas.length === 0 && <Empty>{soloDerivadas ? 'Ninguna duda derivada a Juan.' : 'Aún nadie le ha hecho preguntas al asistente.'}</Empty>}

      {dudas && dudas.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {dudas.map((d) => (
            <li key={d.id} className="py-3 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs ${subtle} tabular-nums`}>{fecha(d.created_at)}</span>
                {d.deriva && <Pill tone="warn">Para Juan</Pill>}
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white whitespace-pre-wrap">{d.pregunta}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{d.respuesta}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
