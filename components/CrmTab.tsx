'use client'

import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction, ReactNode } from 'react'
import { Briefcase, Send, CheckCircle2, Plus, Trash2, MoveRight, XCircle, CheckCircle } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { CRM_COLUMNS, crmColumnOf, type CRMItem, type CrmColumn } from '@/lib/h2b'

interface CrmTabProps {
  crmItems: CRMItem[]
  crmError: boolean
  crmLoading: boolean
  applicationsThisWeek: number
  weeklyTarget: number
  searchHealthPercentage: number
  pendingFollowUps: number
  changeCrmStatus: (id: string, newStatus: CRMItem['status']) => Promise<void>
  deleteCrmItem: (id: string) => Promise<void>
  daysSinceApplied: (item: CRMItem) => number
  markFollowupSent: (item: CRMItem, n: 1 | 2) => Promise<boolean>
  openEmailFor: (item: CRMItem) => void
  renderReplyControl: (item: CRMItem) => ReactNode
  saveNotes: (id: string) => Promise<void>
  editingNotesId: string | null
  setEditingNotesId: Dispatch<SetStateAction<string | null>>
  tempNotes: string
  setTempNotes: Dispatch<SetStateAction<string>>
  setIsManualModalOpen: Dispatch<SetStateAction<boolean>>
  setShowInterviewSimulator: Dispatch<SetStateAction<boolean>>
  setSimulatorJob: Dispatch<SetStateAction<{ company: string; role: string } | null>>
  goToJobs: () => void
}

export default function CrmTab({
  crmItems,
  crmError,
  crmLoading,
  applicationsThisWeek,
  weeklyTarget,
  searchHealthPercentage,
  pendingFollowUps,
  changeCrmStatus,
  deleteCrmItem,
  daysSinceApplied,
  markFollowupSent,
  openEmailFor,
  renderReplyControl,
  saveNotes,
  editingNotesId,
  setEditingNotesId,
  tempNotes,
  setTempNotes,
  setIsManualModalOpen,
  setShowInterviewSimulator,
  setSimulatorJob,
  goToJobs,
}: CrmTabProps) {
  // Celular: se ve una columna a la vez; null = la más urgente que tenga postulaciones
  const [crmColumn, setCrmColumn] = useState<CrmColumn | null>(null)
  const crmChipsRef = useRef<HTMLDivElement>(null)
  const crmCounts = CRM_COLUMNS.reduce(
    (acc, c) => ({ ...acc, [c.id]: crmItems.filter((i) => crmColumnOf(i.status) === c.id).length }),
    {} as Record<CrmColumn, number>
  )
  const visibleCrmColumn: CrmColumn =
    crmColumn ??
    (['seguimiento', 'entrevista', 'postulado', 'guardadas', 'aceptado', 'cerradas'] as CrmColumn[]).find((c) => crmCounts[c] > 0) ??
    'guardadas'
  // En celular solo se ve la columna elegida; en escritorio, todas
  const crmColClass = (c: CrmColumn) => (visibleCrmColumn === c ? 'flex' : 'hidden md:flex')
  useEffect(() => {
    // Deja a la vista el chip de la columna abierta: la fila se desplaza de lado (nunca mueve la página)
    const row = crmChipsRef.current
    const chip = row?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (row && chip) row.scrollLeft = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2
  }, [crmColumn, crmLoading])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Centro de Comando de Postulaciones</h1>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gestiona tus postulaciones, seguimiento de 7-14-21 días, entrevistas y estados finales de forma visual.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="relative z-10 cursor-pointer w-full md:w-auto justify-center min-h-11 md:min-h-0 bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-sm md:text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Agregar Postulación Manual
          </button>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">Salud de tu búsqueda semanal:</span>
              <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                {applicationsThisWeek} de {weeklyTarget} aplicadas
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Mantén el ritmo de postulaciones recomendado para maximizar tus resultados H2B.</p>
          </div>
          <div className="w-full sm:w-48 bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${searchHealthPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {crmError && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-semibold">
            No pudimos cargar tus postulaciones. Tus datos siguen guardados; revisa tu conexión y vuelve a intentarlo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {crmLoading && !crmError && (
        // Esqueleto con la forma del tablero: una columna en celular, seis en escritorio
        <div role="status" aria-label="Cargando tus postulaciones" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-start motion-safe:animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${i > 0 ? 'hidden md:block' : ''} ${i > 1 ? 'md:hidden lg:block' : ''} bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 space-y-3`}>
              <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              {Array.from({ length: i === 0 ? 3 : 2 }).map((_, j) => (
                <div key={j} className="bg-white dark:bg-slate-900 rounded-xl p-3 space-y-2">
                  <div className="h-3.5 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/70" />
                </div>
              ))}
            </div>
          ))}
          <span className="sr-only">Cargando tus postulaciones...</span>
        </div>
      )}

      {!crmError && !crmLoading && crmItems.length === 0 && (
        <EmptyState
          icons={[Briefcase, Send, CheckCircle2]}
          title="Tu CRM está vacío"
          description="Guarda ofertas desde la pestaña Ofertas y aquí verás cada postulación avanzar: postulado, seguimiento, entrevista y aceptado."
          action={{ label: 'Buscar ofertas', onClick: goToJobs }}
        />
      )}

      {!crmError && !crmLoading && crmItems.length > 0 && (
        <div ref={crmChipsRef} role="tablist" aria-label="Columnas de Mi CRM" className="md:hidden relative flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
          {CRM_COLUMNS.map((c) => {
            const active = visibleCrmColumn === c.id
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={active}
                onClick={() => setCrmColumn(c.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-full text-xs font-bold border transition-colors ${
                  active
                    ? 'bg-[#0B4079] border-[#0B4079] text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {c.label}
                <span className={`min-w-5 h-5 px-1 rounded-full text-[11px] leading-5 text-center ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'} ${c.id === 'seguimiento' && pendingFollowUps > 0 && !active ? '!bg-rose-600 text-white' : ''}`}>
                  {crmCounts[c.id]}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className={`${crmError || crmLoading || crmItems.length === 0 ? "hidden" : "grid"} grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-start overflow-x-auto pb-4`}>
        {/* COLUMNA 1: GUARDADAS */}
        <div className={`bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 md:min-h-[500px] flex-col space-y-3 ${crmColClass('guardadas')}`}>
          <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-extrabold text-[11px] text-slate-500 dark:text-slate-400 tracking-wider">GUARDADAS</span>
            <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {crmItems.filter(i => i.status === 'guardadas').length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {crmItems.filter(i => i.status === 'guardadas').map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs space-y-3 relative group">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{item.company}</h3>
                    <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.role}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  {editingNotesId === item.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="Nota rápida..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-lg p-1.5 text-xs sm:text-[10px] focus:outline-none"
                        rows={2}
                      />
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditingNotesId(null)} className="px-2 py-1.5 min-h-11 sm:min-h-0 text-xs sm:text-[10px] text-slate-500 dark:text-slate-400">Cancelar</button>
                        <button onClick={() => saveNotes(item.id)} className="bg-blue-600 text-white px-2.5 py-1.5 min-h-11 sm:min-h-0 text-xs sm:text-[10px] rounded font-bold">Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-[10px] text-slate-600 dark:text-slate-400 italic truncate max-w-[60%] sm:max-w-[100px]">
                        {item.notes ? `📝 ${item.notes}` : 'Sin notas'}
                      </span>
                      <button onClick={() => { setEditingNotesId(item.id); setTempNotes(item.notes || ''); }} className="text-blue-600 dark:text-blue-400 font-bold min-h-11 sm:min-h-0 px-2 sm:px-0 text-xs sm:text-[9px]">
                        {item.notes ? 'Editar' : '+ Nota'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs sm:text-[9px] text-slate-500 dark:text-slate-400">{item.dateLabel}</span>
                  <button onClick={() => changeCrmStatus(item.id, 'postulado')} className="text-xs sm:text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2.5 py-2 min-h-11 sm:min-h-0 rounded-lg">
                    Postular <MoveRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {crmItems.filter(i => i.status === 'guardadas').length === 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic p-3 text-center leading-relaxed">
                Guarda una oferta desde la pestaña Ofertas para empezar tu seguimiento.
              </p>
            )}
          </div>
        </div>

        {/* COLUMNA 2: POSTULADO */}
        <div className={`bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 md:min-h-[500px] flex-col space-y-3 ${crmColClass('postulado')}`}>
          <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-extrabold text-[11px] text-sky-500 dark:text-sky-400 tracking-wider">POSTULADO</span>
            <span className="bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-bold text-xs sm:text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {crmItems.filter(i => i.status === 'postulado').length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {crmItems.filter(i => i.status === 'postulado').map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl p-3.5 shadow-2xs space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{item.company}</h3>
                    <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.role}</p>
                </div>
                <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 text-sky-800 dark:text-sky-300 text-xs sm:text-[9px] font-semibold px-2 py-1 rounded-lg">
                  ✅ Marcaste que ya postulaste
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  {editingNotesId === item.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-lg p-1.5 text-xs sm:text-[10px]"
                        rows={2}
                      />
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditingNotesId(null)} className="px-2 py-1.5 min-h-11 sm:min-h-0 text-xs sm:text-[10px]">Cancelar</button>
                        <button onClick={() => saveNotes(item.id)} className="bg-blue-600 text-white px-2.5 py-1.5 min-h-11 sm:min-h-0 text-xs sm:text-[10px] rounded font-bold">Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-[10px] text-slate-600 dark:text-slate-400 italic truncate max-w-[60%] sm:max-w-[100px]">
                        {item.notes ? `📝 ${item.notes}` : 'Sin notas'}
                      </span>
                      <button onClick={() => { setEditingNotesId(item.id); setTempNotes(item.notes || ''); }} className="text-blue-600 dark:text-blue-400 font-bold min-h-11 sm:min-h-0 px-2 sm:px-0 text-xs sm:text-[9px]">
                        {item.notes ? 'Editar' : '+ Nota'}
                      </button>
                    </div>
                  )}
                </div>
                {renderReplyControl(item)}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-1">
                  <button
                    onClick={() => openEmailFor(item)}
                    title="Redactar correo con tu CV"
                    className="text-xs sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-2.5 py-2 min-h-11 sm:min-h-0 rounded-lg"
                  >
                    ✉️
                  </button>
                  <button onClick={() => changeCrmStatus(item.id, 'seguimiento')} className="text-xs sm:text-[10px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-0.5 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 px-2.5 py-2 min-h-11 sm:min-h-0 rounded-lg">
                    Seguimiento <MoveRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {crmItems.filter(i => i.status === 'postulado').length === 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic p-3 text-center leading-relaxed">
                Cuando postules a una oferta guardada, aparecerá aquí.
              </p>
            )}
          </div>
        </div>

        {/* COLUMNA 3: SEGUIMIENTO (7-14-21 DÍAS) */}
        <div className={`bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 md:min-h-[500px] flex-col space-y-3 ${crmColClass('seguimiento')}`}>
          <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-extrabold text-[11px] text-sky-500 dark:text-sky-400 tracking-wider">SEGUIMIENTO</span>
            <span className="bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-bold text-xs sm:text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {crmItems.filter(i => i.status === 'seguimiento').length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {crmItems.filter(i => i.status === 'seguimiento').map(item => {
              const daysPassed = daysSinceApplied(item)
              let trackingMessage = 'En seguimiento activo'
              let badgeColor = 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
              if (daysPassed >= 14) {
                trackingMessage = '📧 Envía tu segundo correo de seguimiento'
                badgeColor = 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 font-bold'
              } else if (daysPassed >= 7) {
                trackingMessage = '✉️ Envía tu primer correo de seguimiento'
                badgeColor = 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 font-bold'
              }
              // Con el seguimiento ya enviado, el aviso cambia: ya no toca escribir, toca esperar
              if (item.followup2At) {
                trackingMessage = '✅ Segundo seguimiento enviado. Espera su respuesta'
                badgeColor = 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              } else if (item.followup1At && daysPassed < 14) {
                trackingMessage = '✅ Primer seguimiento enviado. El segundo toca el día 14'
                badgeColor = 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              }
              const fmtDay = (t: number) => new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short' })
              return (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl p-3.5 shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{item.company}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.role}</p>
                    </div>
                    <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                  <div className={`${badgeColor} border text-xs sm:text-[9px] font-semibold px-2 py-1 rounded-lg text-center`}>{trackingMessage}</div>
                  {(item.followup1At || item.followup2At) && (
                    <p className="text-xs sm:text-[9px] text-slate-500 dark:text-slate-400">
                      {[item.followup1At ? `1.er seguimiento: ${fmtDay(item.followup1At)}` : '', item.followup2At ? `2.º seguimiento: ${fmtDay(item.followup2At)}` : ''].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {daysPassed >= 7 && !item.followup1At && !item.followup2At && (
                    <button onClick={() => markFollowupSent(item, 1)} className="w-full min-h-11 sm:min-h-0 text-xs sm:text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 py-1.5 rounded-lg">
                      Ya envié el primer seguimiento
                    </button>
                  )}
                  {daysPassed >= 14 && !item.followup2At && (
                    <button onClick={() => markFollowupSent(item, 2)} className="w-full min-h-11 sm:min-h-0 text-xs sm:text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 py-1.5 rounded-lg">
                      Ya envié el segundo seguimiento
                    </button>
                  )}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    {editingNotesId === item.id ? (
                      <div className="space-y-2">
                        <textarea value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-lg p-1.5 text-xs sm:text-[10px]" rows={2} />
                        <div className="flex gap-1 justify-end"><button onClick={() => setEditingNotesId(null)} className="px-2 py-1.5 min-h-11 sm:min-h-0 text-xs sm:text-[10px]">Cancelar</button><button onClick={() => saveNotes(item.id)} className="bg-blue-600 text-white px-2.5 py-1.5 min-h-11 sm:min-h-0 text-xs sm:text-[10px] rounded font-bold">Guardar</button></div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center"><span className="text-xs sm:text-[10px] text-slate-600 dark:text-slate-400 italic truncate max-w-[60%] sm:max-w-[100px]">{item.notes ? `📝 ${item.notes}` : 'Sin notas'}</span><button onClick={() => { setEditingNotesId(item.id); setTempNotes(item.notes || '') }} className="text-blue-600 dark:text-blue-400 font-bold min-h-11 sm:min-h-0 px-2 sm:px-0 text-xs sm:text-[9px]">{item.notes ? 'Editar' : '+ Nota'}</button></div>
                    )}
                  </div>
                  {renderReplyControl(item)}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-1">
                    <button onClick={() => openEmailFor(item)} title="Redactar correo con tu CV" className="text-xs sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-2.5 py-2 min-h-11 sm:min-h-0 rounded-lg">✉️</button>
                    <span className="text-xs sm:text-[9px] text-slate-500 dark:text-slate-400">Día {daysPassed}</span>
                    <button onClick={() => changeCrmStatus(item.id, 'entrevista')} className="text-xs sm:text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-0.5 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 px-2.5 py-2 min-h-11 sm:min-h-0 rounded-lg">Entrevista <MoveRight className="w-3 h-3" /></button>
                  </div>
                </div>
              )
            })}
            {crmItems.filter(i => i.status === 'seguimiento').length === 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic p-3 text-center leading-relaxed">
                A los 7 días de postular, la tarjeta pasa aquí sola y te avisamos por correo para que escribas a la empresa.
              </p>
            )}
          </div>
        </div>

        {/* COLUMNA 4: ENTREVISTA */}
        <div className={`bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 md:min-h-[500px] flex-col space-y-3 ${crmColClass('entrevista')}`}>
          <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-extrabold text-[11px] text-indigo-500 dark:text-indigo-400 tracking-wider">ENTREVISTA</span>
            <span className="bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {crmItems.filter(i => i.status === 'entrevista').length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {crmItems.filter(i => i.status === 'entrevista').map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3.5 shadow-2xs space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{item.company}</h3>
                    <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.role}</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-300 text-xs sm:text-[9px] font-semibold px-2 py-1 rounded-lg text-center">
                  ⭐ En proceso de entrevista
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  {editingNotesId === item.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-lg p-1.5 text-xs sm:text-[10px]"
                        rows={2}
                      />
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditingNotesId(null)} className="px-2 py-1.5 min-h-11 sm:min-h-0 text-xs sm:text-[10px]">Cancelar</button>
                        <button onClick={() => saveNotes(item.id)} className="bg-blue-600 text-white px-2.5 py-1.5 min-h-11 sm:min-h-0 text-xs sm:text-[10px] rounded font-bold">Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-[10px] text-slate-600 dark:text-slate-400 italic truncate max-w-[60%] sm:max-w-[100px]">
                        {item.notes ? `📝 ${item.notes}` : 'Sin notas'}
                      </span>
                      <button onClick={() => { setEditingNotesId(item.id); setTempNotes(item.notes || ''); }} className="text-blue-600 dark:text-blue-400 font-bold min-h-11 sm:min-h-0 px-2 sm:px-0 text-xs sm:text-[9px]">
                        {item.notes ? 'Editar' : '+ Nota'}
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSimulatorJob({ company: item.company, role: item.role })
                    setShowInterviewSimulator(true)
                  }}
                  className="w-full text-xs sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 py-2 min-h-11 sm:min-h-0 rounded-lg"
                >
                  🎤 Practicar esta entrevista
                </button>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => changeCrmStatus(item.id, 'aceptado')}
                    className="bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-[10px] py-2 px-2.5 min-h-11 sm:min-h-0 rounded-lg border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center gap-1 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> Aceptado
                  </button>
                  <button
                    onClick={() => changeCrmStatus(item.id, 'rechazada')}
                    className="bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 font-bold text-xs sm:text-[10px] py-2 px-2.5 min-h-11 sm:min-h-0 rounded-lg border border-rose-200 dark:border-rose-500/30 flex items-center justify-center gap-1 transition-colors"
                  >
                    <XCircle className="w-3 h-3 text-rose-600" /> Rechazado
                  </button>
                </div>
              </div>
            ))}
            {crmItems.filter(i => i.status === 'entrevista').length === 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic p-3 text-center leading-relaxed">
                Aquí verás las postulaciones en las que te llamaron a entrevista.
              </p>
            )}
          </div>
        </div>

        {/* COLUMNA 5: ACEPTADO */}
        <div className={`bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 md:min-h-[500px] flex-col space-y-3 ${crmColClass('aceptado')}`}>
          <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-extrabold text-[11px] text-emerald-800 dark:text-emerald-400 tracking-wider">ACEPTADO</span>
            <span className="bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {crmItems.filter(i => i.status === 'aceptado').length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {crmItems.filter(i => i.status === 'aceptado').map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl p-3.5 shadow-2xs space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs">{item.company}</h3>
                  <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.role}</p>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs sm:text-[9px] font-bold p-1.5 rounded-lg text-center">
                  🎉 ¡Proceso USCIS iniciado!
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <span className="text-xs sm:text-[9px] text-slate-500 dark:text-slate-400">{item.dateLabel}</span>
                </div>
              </div>
            ))}
            {crmItems.filter(i => i.status === 'aceptado').length === 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic p-3 text-center leading-relaxed">
                Aquí verás las ofertas que aceptaste.
              </p>
            )}
          </div>
        </div>

        {/* COLUMNA 6: NO RESPONDIDO / RECHAZADA */}
        <div className={`bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 md:min-h-[500px] flex-col space-y-3 ${crmColClass('cerradas')}`}>
          <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-extrabold text-[11px] text-rose-800 dark:text-rose-400 tracking-wider">NO RESPONDIDO / RECHAZADO</span>
            <span className="bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 font-bold text-xs sm:text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {crmItems.filter(i => i.status === 'no_respondido' || i.status === 'rechazada').length}
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {crmItems.filter(i => i.status === 'no_respondido' || i.status === 'rechazada').map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-xl p-3.5 shadow-2xs space-y-2 opacity-80">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs">{item.company}</h3>
                  <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.role}</p>
                <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 text-xs sm:text-[9px] font-bold p-1.5 rounded-lg text-center">
                  {item.status === 'no_respondido' ? '⌛ Expirado (21 días sin respuesta)' : '❌ Postulación rechazada'}
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs sm:text-[9px] text-slate-500 dark:text-slate-400">{item.dateLabel}</span>
                  <button
                    onClick={() => changeCrmStatus(item.id, 'entrevista')}
                    className="text-xs sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-2.5 py-2 min-h-11 sm:min-h-0 rounded-lg"
                  >
                    Me respondieron
                  </button>
                </div>
              </div>
            ))}
            {crmItems.filter(i => i.status === 'no_respondido' || i.status === 'rechazada').length === 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic p-3 text-center leading-relaxed">
                Si una empresa no responde en 21 días, la tarjeta pasa aquí. Si luego te responden, puedes reactivarla.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
