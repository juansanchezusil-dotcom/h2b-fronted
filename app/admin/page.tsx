'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, UserPlus, RefreshCw, Ban } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'

interface Acceso {
  email: string
  activo: boolean
  vence_el: string | null
  origen: string | null
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin vencimiento'

function estado(a: Acceso): { label: string; style: string } {
  if (!a.activo) return { label: 'Revocado', style: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' }
  if (a.vence_el && new Date(a.vence_el).getTime() < Date.now())
    return { label: 'Vencido', style: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' }
  return { label: 'Activo', style: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' }
}

export default function AdminPage() {
  const [accesos, setAccesos] = useState<Acceso[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [dias, setDias] = useState(30)
  const [busy, setBusy] = useState(false)

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
    load()
  }, [load])

  const send = async (method: 'POST' | 'DELETE', body: object) => {
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
    return true
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await send('POST', { email, dias })) setEmail('')
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Membresías</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Cuando alguien pague en Skool, agrega su correo aquí. El acceso se corta solo al llegar la fecha de vencimiento.
        </p>
      </div>

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
        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-xl"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Dar acceso
        </button>
      </form>

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
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          {accesos.length === 0 && <li className="p-4 text-sm text-slate-500 dark:text-slate-400">Aún no hay miembros.</li>}
          {accesos.map((a) => {
            const st = estado(a)
            return (
              <li key={a.email} className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[12rem]">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white break-all">{a.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Vence: {fmt(a.vence_el)}</p>
                </div>
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${st.style}`}>{st.label}</span>
                <button
                  onClick={() => send('POST', { email: a.email, dias: 30 })}
                  disabled={busy}
                  className="flex items-center gap-1 text-xs font-semibold text-[#0B4079] dark:text-[#C89B3C] hover:underline disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> +30 días
                </button>
                {a.activo && (
                  <button
                    onClick={() => confirm(`¿Revocar el acceso de ${a.email}?`) && send('DELETE', { email: a.email })}
                    disabled={busy}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" /> Revocar
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
