'use client'

import { useRef, useState } from 'react'
import { Info, Loader2, MessageCircle, Send, X } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'
import { errorMessage } from '@/lib/errors'
import AssistantModal from '@/components/AssistantModal'

interface Turn {
  role: 'user' | 'assistant'
  text: string
  deriva?: boolean
}

const EJEMPLOS = ['¿Cómo sé si una oferta es real?', '¿Qué es el DS-160?', '¿Cuándo hago el seguimiento a una empresa?']
const SKOOL_URL = process.env.NEXT_PUBLIC_MEMBERSHIP_URL

// "Pregúntale a Juan": asistente de dudas del Inicio, y el aviso de dónde salen los datos de la app.
export default function AsistenteCard() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fuentes, setFuentes] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const send = async (raw: string) => {
    const message = raw.trim()
    if (message.length < 3 || loading) return
    setError(null)
    setText('')
    const history = turns.map((t) => ({ role: t.role, text: t.text }))
    setTurns((prev) => [...prev, { role: 'user', text: message }])
    setLoading(true)
    try {
      const res = await aiFetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, pantalla: 'Inicio' }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'No pude responder esta vez. Intenta de nuevo.')
      setTurns((prev) => [...prev, { role: 'assistant', text: body.respuesta, deriva: body.deriva === true }])
    } catch (err) {
      setError(errorMessage(err, 'No pude responder esta vez. Intenta de nuevo.'))
    } finally {
      setLoading(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center gap-2">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#0B4079] dark:text-[#C89B3C]" aria-hidden="true" />
            Pregúntale a Juan
          </h2>
          <button
            type="button"
            onClick={() => setFuentes(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline min-h-8"
          >
            <Info className="w-3.5 h-3.5" aria-hidden="true" /> De dónde salen los datos
          </button>
        </div>

        {turns.length === 0 ? (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Resuelve dudas sobre la app, el proceso H-2B y cómo verificar una oferta. No da asesoría legal ni asegura que una oferta sea legítima.
            </p>
            <div className="flex flex-wrap gap-2">
              {EJEMPLOS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {q}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1" aria-live="polite">
            {turns.map((t, i) => (
              <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    t.role === 'user' ? 'bg-[#0B4079] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {t.text}
                  {t.deriva && (
                    <span className="block mt-2 font-semibold">
                      Esta duda conviene que la vea Juan.{' '}
                      {SKOOL_URL ? (
                        <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer" className="underline">
                          Déjala en la comunidad de Skool.
                        </a>
                      ) : (
                        'Déjala en la comunidad de Skool.'
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Pensando…
              </p>
            )}
            <div ref={endRef} />
          </div>
        )}

        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            send(text)
          }}
        >
          <label htmlFor="asistente-duda" className="sr-only">
            Escribe tu duda
          </label>
          <input
            id="asistente-duda"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={600}
            placeholder="Escribe tu duda…"
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
          />
          <button
            type="submit"
            disabled={loading || text.trim().length < 3}
            className="bg-[#0B1528] hover:bg-[#11223f] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Send className="w-3.5 h-3.5" aria-hidden="true" />}
            Preguntar
          </button>
        </form>
      </div>

      <AssistantModal isOpen={fuentes} label="De dónde salen los datos" onClose={() => setFuentes(false)}>
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">De dónde salen los datos</h2>
            <button type="button" onClick={() => setFuentes(false)} aria-label="Cerrar" className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            La información de ofertas, empresas y agencias viene de fuentes públicas oficiales, entre ellas el Departamento de Trabajo (DOL), USCIS y CareerOneStop.
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Juan Te Avisa PRO las organiza, las traduce, las filtra y las conecta con tu plan: tu CRM, tu CV, tu carta, el detector de estafas y tu Mapa. Esas son las partes que cuesta armar por tu cuenta.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Antes de postular o pagar algo, verifica siempre la oferta en la fuente oficial. Nadie puede cobrarte por darte un empleo H-2B.
          </p>
        </div>
      </AssistantModal>
    </>
  )
}
