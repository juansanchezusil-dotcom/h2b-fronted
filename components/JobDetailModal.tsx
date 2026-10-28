'use client'

import { Plus, X, Check } from 'lucide-react'
import SponsorHistory from '@/components/SponsorHistory'
import { labelForStatus, crmKey, type Job, type CRMItem, type ApplyFlowJob } from '@/lib/h2b'

interface JobDetailModalProps {
  selectedJob: Job
  setSelectedJob: (job: Job | null) => void
  crmItems: CRMItem[]
  addToCRM: (company?: string, role?: string, stateStr?: string) => Promise<boolean>
  setApplyFlowJob: (job: ApplyFlowJob) => void
}

export default function JobDetailModal({
  selectedJob,
  setSelectedJob,
  crmItems,
  addToCRM,
  setApplyFlowJob,
}: JobDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center sm:p-4">
      {/* Celular: pantalla completa. Escritorio: ventana de 90vh. El botón cerrar y Postular quedan
          fuera del scroll interno, así nunca se van con el contenido */}
      <div role="dialog" aria-modal="true" aria-label="Detalle de la oferta" className="bg-white dark:bg-slate-900 sm:rounded-3xl max-w-lg w-full h-dvh sm:h-auto sm:max-h-[90vh] shadow-2xl relative overflow-hidden flex flex-col pt-[env(safe-area-inset-top)] sm:pt-0">

        {/* BOTÓN CERRAR */}
        <button
          onClick={() => setSelectedJob(null)}
          aria-label="Cerrar"
          className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] sm:top-5 right-3 sm:right-5 w-11 h-11 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">

        {/* ENCABEZADO CON ID, TITULO Y FECHAS (a la derecha en escritorio, debajo en celular) */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 pr-10 sm:pr-6">
          <div className="space-y-1">
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded">
              Job Order ID: {selectedJob.case_number || selectedJob.job_order_id || selectedJob.id}
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">{selectedJob.title || selectedJob.job_title}</h2>
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400">{selectedJob.employer_name || selectedJob.emp_name}</p>
          </div>

          <div className="sm:text-right text-[11px] shrink-0 sm:pt-1 leading-tight">
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              <strong>Begin date:</strong> {selectedJob.begin_date || selectedJob.start_date || selectedJob.fecha_inicio || "N/A"}
            </p>
            <p className="text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              <strong>End date:</strong> {selectedJob.end_date || selectedJob.fecha_fin || "N/A"}
            </p>
          </div>
        </div>

        {/* GRILLA RESUMEN */}
        <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100/80 dark:border-slate-700/80">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium text-[11px]">Ubicación:</span>
            <strong className="text-slate-800 dark:text-slate-100 font-bold">{selectedJob.location || `${selectedJob.city || ''}, ${selectedJob.state || ''}`.trim() || 'N/A'}</strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium text-[11px]">Salario:</span>
            <strong className="text-slate-800 dark:text-slate-100 font-bold">{selectedJob.wage || selectedJob.pay_rate || 'N/A'}</strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium text-[11px]">Vacantes:</span>
            <strong className="text-slate-800 dark:text-slate-100 font-bold">{selectedJob.workers_requested || selectedJob.workers_needed || selectedJob.vacantes || 'N/A'}</strong>
          </div>
        </div>

        {/* HISTORIAL DE LA EMPRESA EN USCIS */}
        <SponsorHistory sponsor={selectedJob.sponsor} match={selectedJob.sponsor_match ?? null} variant="full" />

        {/* RECRUITMENT INFORMATION */}
        <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3 text-left">
          <h3 className="font-bold text-blue-900 dark:text-blue-300 text-xs">Recruitment Information</h3>
          <p className="text-[11px] text-slate-700 dark:text-slate-300">
            <strong>Telephone Number to Apply:</strong> {selectedJob.phone_to_apply || selectedJob.phone || selectedJob.recruitment_phone || "N/A"}
          </p>
          <p className="text-[11px] text-slate-700 dark:text-slate-300">
            <strong>Email address to Apply:</strong>{" "}
            {(selectedJob.email || selectedJob.recruitment_email || selectedJob.email_to_apply || selectedJob.emp_email) ? (
              <a
                href={`mailto:${selectedJob.email || selectedJob.recruitment_email || selectedJob.email_to_apply || selectedJob.emp_email}`}
                className="text-blue-600 dark:text-blue-400 underline font-medium"
              >
                {selectedJob.email || selectedJob.recruitment_email || selectedJob.email_to_apply || selectedJob.emp_email}
              </a>
            ) : (
              "N/A"
            )}
          </p>
        </div>

        {/* JOB DESCRIPTION */}
        <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3 text-left">
          <h3 className="font-bold text-blue-900 dark:text-blue-300 text-xs">Job Description</h3>
          <p className="text-[11px] text-slate-700 dark:text-slate-300">
            <strong>Full Time:</strong> {(selectedJob.full_time !== undefined ? (selectedJob.full_time ? "Yes" : "No") : (selectedJob.jornada === 'Tiempo Completo' ? "Yes" : "No"))}
          </p>
          <p className="text-[11px] text-slate-700 dark:text-slate-300">
            <strong>Number of Workers Requested:</strong> {selectedJob.workers_requested || selectedJob.workers_needed || selectedJob.vacantes || "N/A"}
          </p>

          <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 mt-2">
            <strong>Job Duties:</strong>
            {/*
                 - Se removió 'max-h-28' y se cambió a 'max-h-48'
                 - 'overflow-y-auto' muestra scroll SOLO si sobrepasa la altura
              */}
            <p className="mt-0.5 sm:max-h-48 sm:overflow-y-auto pr-1 whitespace-pre-line text-slate-600 dark:text-slate-300 scrollbar-thin">
              {selectedJob.job_description || selectedJob.job_duties || selectedJob.description || selectedJob.duties || "Sin descripción disponible."}
            </p>
          </div>
        </div>

        </div>

        {/* BOTONES FIJOS ABAJO: guardar en el CRM y postular */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 px-5 sm:px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4 bg-white dark:bg-slate-900">
          {(() => {
            const key = crmKey(
              selectedJob.employer_name || selectedJob.emp_name || '',
              selectedJob.title || selectedJob.job_title || ''
            )
            const existing = crmItems.find(i => crmKey(i.company, i.role) === key)
            if (existing && existing.status !== 'guardadas') {
              return (
                <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs py-3 rounded-xl text-center">
                  ✓ Ya postulaste — estado: {labelForStatus(existing.status)}
                </div>
              )
            }
            return (
              <div className="flex gap-2">
              {existing ? (
                <span className="shrink-0 inline-flex items-center gap-1.5 min-h-12 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                  <Check className="w-4 h-4" /> Guardada
                </span>
              ) : (
                <button
                  onClick={() => addToCRM(
                    selectedJob.employer_name || selectedJob.emp_name,
                    selectedJob.title || selectedJob.job_title,
                    selectedJob.location || `${selectedJob.city || ''}, ${selectedJob.state || ''}`.trim()
                  )}
                  className="shrink-0 inline-flex items-center gap-1.5 min-h-12 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold"
                >
                  <Plus className="w-4 h-4" /> Guardar
                </button>
              )}
              <button
                onClick={() => setApplyFlowJob({
                  title: selectedJob.title || selectedJob.job_title || 'Vacante H2B',
                  employerName: selectedJob.employer_name || selectedJob.emp_name || 'Empresa Generica',
                  location: selectedJob.location || `${selectedJob.city || ''}, ${selectedJob.state || ''}`.trim(),
                  contactEmail: selectedJob.email_to_apply || selectedJob.email || selectedJob.recruitment_email || selectedJob.emp_email || '',
                  duties: selectedJob.job_description || selectedJob.job_duties || selectedJob.description || selectedJob.duties || '',
                  reference: selectedJob.case_number || selectedJob.job_order_id || '',
                })}
                className="flex-1 min-h-12 bg-[#00A86B] hover:bg-[#008f5b] text-white font-bold text-sm sm:text-xs py-3 rounded-xl transition-all text-center flex items-center justify-center gap-2 shadow-sm"
              >
                ✉️ Postular ahora
              </button>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
