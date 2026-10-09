'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { aiFetch } from '@/lib/aiFetch'

interface Oferta {
  id: string
  job_title: string
  company_name: string
  state: string | null
  url: string | null
  note: string | null
  active: boolean
  created_at: string
}

const inputClass =
  'rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/30'

// Panel del administrador: agrega las ofertas que encuentras en vivo en la clase. Los miembros las ven en Mi Mapa.
export default function ClassOffersPanel() {
  const [ofertas, setOfertas] = useState<Oferta[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [puesto, setPuesto] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [estado, setEstado] = useState('')
  const [url, setUrl] = useState('')
  const [nota, setNota] = useState('')

  const load = useCallback(async () => {
    setError(null)
    const res = await aiFetch('/api/admin/ofertas')
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error || 'No se pudo cargar la lista.')
      return
    }
    setOfertas(data.ofertas)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await aiFetch('/api/admin/ofertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puesto, empresa, estado, url, nota }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(data.error || 'No se pudo guardar.')
      return
    }
    setPuesto('')
    setEmpresa('')
    setEstado('')
    setUrl('')
    setNota('')
    await load()
  }

  const remove = async (id: string) => {
    setBusy(true)
    setError(null)
    const res = await aiFetch('/api/admin/ofertas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) setError(data.error || 'No se pudo quitar.')
    else await load()
  }

  const activas = (ofertas || []).filter((o) => o.active)

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Agrega las ofertas que encuentres en vivo. Los miembros las ven en su Mi Mapa y las guardan en su CRM. Antes de agregar una, pásala por tus 4 puntos de verificación.
      </p>

      <form onSubmit={add} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input required value={puesto} onChange={(e) => setPuesto(e.target.value)} maxLength={120} placeholder="Puesto (ej.: Housekeeper)" aria-label="Puesto" className={inputClass} />
        <input required value={empresa} onChange={(e) => setEmpresa(e.target.value)} maxLength={120} placeholder="Empresa" aria-label="Empresa" className={inputClass} />
        <input value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={40} placeholder="Estado (ej.: FL)" aria-label="Estado" className={inputClass} />
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={400} placeholder="Enlace de la oferta (https://...)" aria-label="Enlace" className={inputClass} />
        <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300} placeholder="Nota corta (opcional)" aria-label="Nota" className={`${inputClass} sm:col-span-2`} />
        <button
          type="submit"
          disabled={busy}
          className="sm:col-span-2 flex items-center justify-center gap-2 bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white font-bold text-sm px-4 py-2 rounded-xl"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Agregar oferta
        </button>
      </form>

      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">{error}</p>
      )}

      {!ofertas && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
        </div>
      )}

      {ofertas && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          {activas.length === 0 && <li className="p-4 text-sm text-slate-500 dark:text-slate-400">No hay ofertas activas.</li>}
          {activas.map((o) => (
            <li key={o.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[12rem]">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{o.job_title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{`${o.company_name}${o.state ? ` · ${o.state}` : ''}`}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(o.id)}
                disabled={busy}
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
