'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Briefcase, Search, MapPin, Calendar, Users, SlidersHorizontal } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import InfoTooltip from '@/components/InfoTooltip'
import Pagination from '@/components/Pagination'
import SponsorHistory from '@/components/SponsorHistory'
import { US_STATES, sourceInfo, splitWage, crmKey, type Job, type CRMItem } from '@/lib/h2b'

interface JobsTabProps {
  filteredJobs: Job[]
  isLoading: boolean
  totalJobsCount: number
  totalJobPages: number
  jobPage: number
  setJobPage: Dispatch<SetStateAction<number>>
  jobSearch: string
  setJobSearch: Dispatch<SetStateAction<string>>
  selectedSeason: string
  setSelectedSeason: Dispatch<SetStateAction<string>>
  selectedJobState: string
  setSelectedJobState: Dispatch<SetStateAction<string>>
  selectedJobSector: string
  setSelectedJobSector: Dispatch<SetStateAction<string>>
  onlyHiresAbroad: boolean
  setOnlyHiresAbroad: Dispatch<SetStateAction<boolean>>
  jobSortBy: 'recent' | 'match'
  setJobSortBy: Dispatch<SetStateAction<'recent' | 'match'>>
  sponsorFilter: { id: number; name: string } | null
  setSponsorFilter: Dispatch<SetStateAction<{ id: number; name: string } | null>>
  jobFiltersOpen: boolean
  setJobFiltersOpen: Dispatch<SetStateAction<boolean>>
  activeJobFilters: number
  isSummerNow: boolean
  profileCompleted: boolean
  matchScores: Record<string, { score: number; breakdown: unknown }>
  crmItems: CRMItem[]
  savingCrmKey: string | null
  addToCRM: (company?: string, role?: string, stateStr?: string) => Promise<boolean>
  setSelectedJob: (job: Job | null) => void
}

export default function JobsTab({
  filteredJobs,
  isLoading,
  totalJobsCount,
  totalJobPages,
  jobPage,
  setJobPage,
  jobSearch,
  setJobSearch,
  selectedSeason,
  setSelectedSeason,
  selectedJobState,
  setSelectedJobState,
  selectedJobSector,
  setSelectedJobSector,
  onlyHiresAbroad,
  setOnlyHiresAbroad,
  jobSortBy,
  setJobSortBy,
  sponsorFilter,
  setSponsorFilter,
  jobFiltersOpen,
  setJobFiltersOpen,
  activeJobFilters,
  isSummerNow,
  profileCompleted,
  matchScores,
  crmItems,
  savingCrmKey,
  addToCRM,
  setSelectedJob,
}: JobsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Ofertas Laborales Activas</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Mostrando 21 ofertas por página de <strong className="text-slate-900 dark:text-white">{totalJobsCount} vacantes con estos filtros</strong>.
            </p>
          </div>
        </div>

        {sponsorFilter && (
          <div className="flex items-center justify-between gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl px-3.5 py-2">
            <span className="text-xs text-blue-900 dark:text-blue-300">
              Mostrando solo vacantes de <strong>{sponsorFilter.name}</strong>
            </span>
            <button
              onClick={() => { setSponsorFilter(null); setJobPage(1) }}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 shrink-0"
            >
              Quitar ✕
            </button>
          </div>
        )}

        {/* Celular: buscador + botón Filtros (el resto va en el panel). Escritorio: todo en línea como siempre */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-y-4">
          <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              aria-label="Buscar por puesto, empresa, ciudad"
              placeholder="Buscar por puesto, empresa, ciudad..."
              value={jobSearch}
              onChange={(e) => {
                setJobSearch(e.target.value)
                setSponsorFilter(null)
                setJobPage(1)
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 text-xs">🔍</span>
          </div>
          <button
            onClick={() => setJobFiltersOpen(true)}
            aria-expanded={jobFiltersOpen}
            className="md:hidden shrink-0 inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeJobFilters > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-[#0B4079] text-white text-[11px] leading-5 text-center">{activeJobFilters}</span>
            )}
          </button>
          </div>

          {jobFiltersOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-slate-900/50" onClick={() => setJobFiltersOpen(false)} aria-hidden="true" />
          )}
          <div
            role={jobFiltersOpen ? 'dialog' : undefined}
            aria-modal={jobFiltersOpen ? true : undefined}
            aria-label={jobFiltersOpen ? 'Filtros de ofertas' : undefined}
            className={jobFiltersOpen
              ? 'fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3 shadow-2xl md:contents'
              : 'hidden md:contents'}
          >
          <div className="md:hidden">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white">Filtros</h2>
              {activeJobFilters > 0 && (
                <button
                  onClick={() => {
                    setSelectedSeason('ALL'); setSelectedJobState('ALL'); setSelectedJobSector('ALL')
                    setOnlyHiresAbroad(false); setJobSortBy('recent'); setJobPage(1)
                  }}
                  className="text-xs font-bold text-blue-700 dark:text-blue-400 min-h-11 px-2"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
          <select
            aria-label="Temporada H-2B"
            value={selectedSeason}
            onChange={(e) => {
              setSelectedSeason(e.target.value)
              setJobPage(1)
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="ALL">Todas las Fechas de Inicio</option>
            <option value="SUMMER">☀️ Verano (Abril a Septiembre){isSummerNow ? ' — temporada actual' : ''}</option>
            <option value="WINTER">❄️ Invierno (Octubre a Marzo){!isSummerNow ? ' — temporada actual' : ''}</option>
          </select>

          {/* SELECTOR COMPLETO DE ESTADOS PARA OFERTAS */}
          <select
            aria-label="Estado de EE. UU."
            value={selectedJobState}
            onChange={(e) => {
              setSelectedJobState(e.target.value)
              setJobPage(1)
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="ALL">Todos los Estados (EE. UU.)</option>
            {US_STATES.map((st) => (
              <option key={st.code} value={st.code}>
                {st.name} ({st.code})
              </option>
            ))}
          </select>
          <select
            aria-label="Sector de la oferta"
            value={selectedJobSector}
            onChange={(e) => {
              setSelectedJobSector(e.target.value)
              setJobPage(1)
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="ALL">Todos los Sectores</option>
            <option value="Hotelería">Hotelería y Restaurantes</option>
            <option value="Construcción">Construcción y Mantenimiento</option>
            <option value="Paisajismo">Paisajismo y Jardinería (Landscaping)</option>
            <option value="Agricultura">Agricultura y Cosecha</option>
            <option value="Limpieza">Limpieza y Housekeeping</option>
            <option value="Cocina">Cocina y Preparación de Alimentos</option>
            <option value="Procesamiento">Procesamiento de Alimentos / Carnes</option>
            <option value="Bodega">Bodega, Almacén y Logística</option>
            <option value="Fábrica">Fábricas y Manufactura</option>
          </select>

        <label className="md:col-span-4 flex items-start gap-2.5 cursor-pointer bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 rounded-xl px-3.5 py-2.5">
          <input
            type="checkbox"
            checked={onlyHiresAbroad}
            onChange={(e) => {
              setOnlyHiresAbroad(e.target.checked)
              setJobPage(1)
            }}
            className="mt-0.5 w-4 h-4 accent-[#0B4079]"
          />
          <span className="text-xs text-sky-900 dark:text-sky-300">
            <strong>🌎 Solo empresas que contratan desde el extranjero</strong>
            <span className="block text-[11px] text-sky-800/80 dark:text-sky-400/80">
              Empresas que en 2026 trajeron trabajadores con visa tramitada en un consulado fuera de EE. UU.
            </span>
          </span>
        </label>

        <div className="md:col-span-4 flex flex-wrap items-center gap-2">
          <label htmlFor="job-sort" className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Ordenar por:</label>
          <select
            id="job-sort"
            value={jobSortBy}
            onChange={(e) => setJobSortBy(e.target.value as 'recent' | 'match')}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="recent">Más recientes</option>
            <option value="match">Mejor compatible con tu perfil</option>
          </select>
          {jobSortBy === 'match' && !profileCompleted && (
            <span className="text-[11px] text-amber-700 dark:text-amber-400">Completa tu perfil para ver esto ordenado de verdad.</span>
          )}
        </div>

          <button
            onClick={() => { setJobFiltersOpen(false); window.scrollTo({ top: 0 }) }}
            className="md:hidden w-full min-h-12 rounded-xl bg-[#0B4079] text-white text-sm font-bold"
          >
            {isLoading ? 'Buscando…' : `Ver ${totalJobsCount} ofertas`}
          </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        // Esqueletos con la forma de las tarjetas: la lista no "salta" cuando llegan los datos
        <div role="status" aria-label="Cargando ofertas" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 motion-safe:animate-pulse"
            >
              <div className="h-3 w-2/5 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-3/5 rounded bg-slate-100 dark:bg-slate-800/70" />
              <div className="h-9 w-full rounded-xl bg-slate-100 dark:bg-slate-800/70" />
            </div>
          ))}
          <span className="sr-only">Cargando ofertas...</span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icons={[MapPin, Search, Briefcase]}
          title="No hay ofertas con estos filtros"
          description="Prueba con otra temporada, otro estado o quita algún filtro. Cada día entran ofertas nuevas del DOL."
          action={{
            label: 'Quitar todos los filtros',
            onClick: () => {
              setJobSearch('')
              setSelectedSeason('ALL')
              setSelectedJobState('ALL')
              setSelectedJobSector('ALL')
              setOnlyHiresAbroad(false)
              setSponsorFilter(null)
              setJobPage(1)
            },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job, idx) => (
            <div
              key={job.id || job.job_order_id || idx}
              onClick={() => setSelectedJob(job)}
              onKeyDown={(e) => {
                // El botón "Guardar" de adentro también es foco-able; solo abre
                // el detalle si Enter/Espacio se presionó sobre la tarjeta misma
                if (e.target !== e.currentTarget) return
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedJob(job) }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Ver detalle de ${job.title || 'oferta'} en ${job.employer_name || 'empresa registrada'}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 leading-snug">{job.employer_name || 'Empleador Registrado'}</p>
                  {(() => {
                    const source = sourceInfo(job.source)
                    return (
                      <InfoTooltip text={source.tooltip}>
                        <span className="shrink-0 bg-emerald-50 text-emerald-800 font-bold text-xs sm:text-[10px] px-2 py-0.5 rounded border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
                          ✓ Verificada · {source.label}
                        </span>
                      </InfoTooltip>
                    )
                  })()}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{job.title || 'Oferta de Trabajo'}</h3>

                {(() => {
                  const wage = splitWage(job.wage)
                  return wage ? (
                    <p className="flex items-baseline gap-1">
                      <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">{wage.amount}</span>
                      {wage.unit && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ {wage.unit}</span>}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Salario según contrato</p>
                  )
                })()}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {job.location || `${job.city || ''} ${job.state || ''}`.trim() || 'EE. UU.'}
                  </span>
                  {job.begin_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Inicia {job.begin_date}
                    </span>
                  )}
                  {Number(job.workers_requested) > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {job.workers_requested} vacantes
                    </span>
                  )}
                </div>

                {(() => {
                  const match = job.id != null ? matchScores[String(job.id)] : undefined
                  if (!match) return null
                  return (
                    <InfoTooltip text="Qué tanto encaja esta oferta con tu perfil (industria, experiencia e inglés). No es la probabilidad de que te den la visa.">
                      <span
                        className={`font-bold text-xs sm:text-[10px] px-2 py-0.5 rounded border ${
                          match.score >= 80
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30'
                            : match.score >= 50
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                            : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {match.score >= 80 ? '🔥' : match.score >= 50 ? '🟡' : '⚪'} {match.score}% compatible
                      </span>
                    </InfoTooltip>
                  )
                })()}

                <SponsorHistory sponsor={job.sponsor} match={job.sponsor_match ?? null} />
              </div>
              <div className="space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCRM(job.employer_name, job.title, job.location);
                  }}
                  disabled={savingCrmKey !== null}
                  className="w-full bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {crmItems.some(i => crmKey(i.company, i.role) === crmKey(job.employer_name || 'Empresa Generica', job.title || 'Vacante H2B'))
                    ? '✓ Ya está en tu CRM'
                    : '+ Guardar Oferta en Mi CRM'}
                </button>
                <p className="text-xs sm:text-[10px] font-mono text-slate-400 dark:text-slate-500 text-center">
                  {job.case_number || job.job_order_id || `ID: ${job.id || idx + 1}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={jobPage}
        totalPages={totalJobPages}
        totalItems={totalJobsCount}
        itemLabel="ofertas"
        disabled={isLoading}
        onChange={setJobPage}
      />
    </div>
  )
}
