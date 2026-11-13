'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, UserPlus, RefreshCw, Ban } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'

interface Acceso {
  email: string
  activo: boolean
  vence_el: string | null
  origen: string | null
  created_at: string | null
  ultima_visita: string | null
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin vencimiento'

type Tab = 'activos' | 'indefinidos' | 'vencidos' | 'revocados'

const vencido = (a: Acceso) => a.activo && !!a.vence_el && new Date(a.vence_el).getTime() < Date.now()
const indefinido = (a: Acceso) => a.activo && !a.vence_el
const enTab = (a: Acceso, k: Tab) =>
  k === 'revocados' ? !a.activo : k === 'vencidos' ? vencido(a) : k === 'indefinidos' ? indefinido(a) : a.activo && !!a.vence_el && !vencido(a)
const TAB_LABEL: Record<Tab, string> = { activos: 'Activos', indefinidos: 'Indefinidos', vencidos: 'Vencidos', revocados: 'Revocados' }
const EMPTY_TAB: Record<Tab, string> = {
  activos: 'Aún no hay miembros activos.',
  indefinidos: 'No hay accesos indefinidos.',
  vencidos: 'No hay accesos vencidos.',
  revocados: 'No hay accesos revocados.',
}
const fmtDia = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : 'sin fecha')

function estado(a: Acceso): { label: string; style: string } {
  if (!a.activo) return { label: 'Revocado', style: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' }
  if (a.vence_el && new Date(a.vence_el).getTime() < Date.now())
    return { label: 'Vencido', style: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' }
  return { label: 'Activo', style: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' }
}

// Gestión de membresías: dar acceso cuando alguien paga en Skool, renovar y revocar
export default function MembershipsPanel() {
  const [accesos, setAccesos] = useState<Acceso[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [dias, setDias] = useState(30)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<Tab>('activos')
  const [cortesia, setCortesia] = useState(false)
  const [extra, setExtra] = useState<Record<string, string>>({})
  // Correo cuya revocación espera confirmación (segundo clic), en vez de un cuadro del navegador
  const [confirmingRevoke, setConfirmingRevoke] = useState<string | null>(null)
  // Resultado del correo de bienvenida tras dar acceso
  const [aviso, setAviso] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await aiFetch('/api/admin/accesos')
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(res.status === 403 ? 'Tu cuenta no es administradora.' : data.error || 'No se pudo cargar la lista.')
      return
    }
    setAccesos(data.accesos)
  }, [])

  useEffect(() => {
    // Carga inicial de datos al abrir el panel; load() es la misma función del botón Actualizar
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const send = async (method: 'POST' | 'DELETE' | 'PATCH', body: object) => {
    setBusy(true)
    setError(null)
    const res = await aiFetch('/api/admin/accesos', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(data.error || 'No se pudo completar la acción.')
      return false
    }
    await load()
    if (data.correoBienvenida) {
      setAviso(
        data.correoBienvenida.sent
          ? 'Correo de bienvenida con el link enviado.'
          : `Acceso creado, pero el correo de bienvenida NO se envió (${data.correoBienvenida.reason || 'error'}). Envía el link a mano.`
      )
    }
    return true
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await send('POST', { email, dias, ...(cortesia ? { cortesia: true } : {}) })) setEmail('')
  }

  const visibles = (accesos ?? [])
    .filter((a) => enTab(a, tab))
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))

  return (
    <div className="space-y-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Cuando alguien pague en Skool, agrega su correo aquí. El acceso se corta solo al llegar la fecha de vencimiento.
        </p>
        <form
          onSubmit={add}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            aria-label="Correo del miembro"
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="number"
              min={1}
              max={3650}
              value={dias}
              onChange={(e) => setDias(Number(e.target.value))}
              aria-label="Días de acceso"
              className="w-20 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm"
            />
            días
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={cortesia} onChange={(e) => setCortesia(e.target.checked)} />
            Cortesía (gratis)
          </label>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-xl"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Dar acceso
          </button>
        </form>

        {aviso && !error && (
          <p className="text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
            {aviso}
          </p>
        )}

        {error && (
          <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!accesos && !error && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        )}

        {accesos && (
          <div className="flex gap-2" role="tablist">
            {(['activos', 'indefinidos', 'vencidos', 'revocados'] as const).map((k) => {
              const count = accesos.filter((a) => enTab(a, k)).length
              return (
                <button
                  key={k}
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${
                    tab === k
                      ? 'bg-[#0B4079] text-white border-[#0B4079]'
                      : 'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {TAB_LABEL[k]} ({count})
                </button>
              )
            })}
          </div>
        )}

        {accesos && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            {visibles.length === 0 && (
              <li className="p-4 text-sm text-slate-500 dark:text-slate-400">
                {EMPTY_TAB[tab]}
              </li>
            )}
            {visibles.map((a) => {
              const st = estado(a)
              return (
                <li key={a.email} className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[12rem]">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white break-all">{a.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ingresó: {fmtDia(a.created_at)} · Vence: {fmt(a.vence_el)}
                    </p>
                  </div>
                  {a.activo && (
                    <span
                      title={a.ultima_visita ? `Última visita: ${fmtDia(a.ultima_visita)}` : 'Todavía no ha iniciado sesión'}
                      className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                        a.ultima_visita
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}
                    >
                      {a.ultima_visita ? `Entró · ${fmtDia(a.ultima_visita)}` : 'Aún no entra'}
                    </span>
                  )}
                  {a.origen === 'cortesia' && (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                      Cortesía
                    </span>
                  )}
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${st.style}`}>{st.label}</span>
                  {a.origen !== 'prueba' && (
                    <button
                      onClick={() => send('PATCH', { email: a.email, cortesia: a.origen !== 'cortesia' })}
                      disabled={busy}
                      className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline disabled:opacity-50"
                    >
                      {a.origen === 'cortesia' ? 'Marcar de pago' : 'Marcar cortesía'}
                    </button>
                  )}
                  <button
                    onClick={() => send('POST', { email: a.email, dias: 30 })}
                    disabled={busy}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0B4079] dark:text-[#C89B3C] hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> +30 días
                  </button>
                  <button
                    onClick={() => send('POST', { email: a.email, dias: 365 })}
                    disabled={busy}
                    className="flex items-center gap-1 text-xs font-semibold text-[#0B4079] dark:text-[#C89B3C] hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> +1 año
                  </button>
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      placeholder="días"
                      value={extra[a.email] ?? ''}
                      onChange={(e) => setExtra((x) => ({ ...x, [a.email]: e.target.value }))}
                      aria-label={`Días a sumar a ${a.email}`}
                      className="w-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-2 py-1 text-xs"
                    />
                    <button
                      onClick={async () => {
                        const n = Number(extra[a.email])
                        if (n >= 1 && (await send('POST', { email: a.email, dias: n }))) setExtra((x) => ({ ...x, [a.email]: '' }))
                      }}
                      disabled={busy || !(Number(extra[a.email]) >= 1)}
                      className="text-xs font-semibold text-[#0B4079] dark:text-[#C89B3C] hover:underline disabled:opacity-50"
                    >
                      Sumar
                    </button>
                  </span>
                  {a.vence_el && (
                    <button
                      onClick={() => send('POST', { email: a.email, indefinido: true })}
                      disabled={busy}
                      className="text-xs font-semibold text-[#0B4079] dark:text-[#C89B3C] hover:underline disabled:opacity-50"
                    >
                      Indefinido
                    </button>
                  )}
                  {a.activo && (
                    confirmingRevoke === a.email ? (
                      <span className="flex items-center gap-2 text-xs">
                        <button
                          onClick={async () => {
                            await send('DELETE', { email: a.email })
                            setConfirmingRevoke(null)
                          }}
                          disabled={busy}
                          className="font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg px-2.5 py-1 disabled:opacity-50"
                        >
                          Sí, revocar
                        </button>
                        <button onClick={() => setConfirmingRevoke(null)} className="font-semibold text-slate-500 dark:text-slate-400 hover:underline">
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmingRevoke(a.email)}
                        disabled={busy}
                        className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-50"
                      >
                        <Ban className="w-3.5 h-3.5" /> Revocar
                      </button>
                    )
                  )}
                </li>
              )
            })}
          </ul>
        )}
    </div>
  )
}
