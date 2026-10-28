'use client'

import type { Dispatch, SetStateAction } from 'react'
import Pagination from '@/components/Pagination'
import { type SponsorAgency } from '@/lib/h2b'

interface AgenciesTabProps {
  agencies: SponsorAgency[]
  isLoading: boolean
  totalAgenciesCount: number
  totalAgencyPages: number
  agencyPage: number
  setAgencyPage: Dispatch<SetStateAction<number>>
  agencySearch: string
  setAgencySearch: Dispatch<SetStateAction<string>>
  selectedAgencyCountry: string
  setSelectedAgencyCountry: Dispatch<SetStateAction<string>>
}

export default function AgenciesTab({
  agencies,
  isLoading,
  totalAgenciesCount,
  totalAgencyPages,
  agencyPage,
  setAgencyPage,
  agencySearch,
  setAgencySearch,
  selectedAgencyCountry,
  setSelectedAgencyCountry,
}: AgenciesTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Verifica un Reclutador</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lista oficial del DOL de agencias y reclutadores declarados para H-2B —{' '}
              <strong className="text-slate-900 dark:text-white">{totalAgenciesCount} con estos filtros</strong>. Úsala para revisar si
              quien te contactó está en la lista oficial antes de dar tus datos.
            </p>
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-300">
          ⚠️ ¿Te contactó alguien pidiendo dinero o tus documentos? Aunque aparezca aquí, revísalo con el{' '}
          <strong>Detector de Estafas</strong> en Asistentes IA antes de responder.
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            aria-label="Buscar agencia por nombre o ciudad"
            value={agencySearch}
            onChange={(e) => {
              setAgencySearch(e.target.value)
              setAgencyPage(1)
            }}
            placeholder="Buscar agencia por nombre o ciudad..."
            className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            aria-label="País de la agencia"
            value={selectedAgencyCountry}
            onChange={(e) => {
              setSelectedAgencyCountry(e.target.value)
              setAgencyPage(1)
            }}
            className="w-full sm:w-56 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos los Países</option>
            <option value="MEXICO">México</option>
            <option value="JAMAICA">Jamaica</option>
            <option value="SOUTH AFRICA">Sudáfrica</option>
            <option value="MOLDOVA">Moldavia</option>
            <option value="EL SALVADOR">El Salvador</option>
            <option value="US">Estados Unidos (US)</option>
            <option value="GUATEMALA">Guatemala</option>
            <option value="HONDURAS">Honduras</option>
            <option value="NICARAGUA">Nicaragua</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div role="status" aria-label="Cargando agencias" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 motion-safe:animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/70" />
                </div>
              </div>
              <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/70" />
              <div className="h-9 w-full rounded-xl bg-slate-100 dark:bg-slate-800/70" />
            </div>
          ))}
          <span className="sr-only">Cargando agencias...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agencies.map((agency, idx) => {
            const webLink = agency.website
            const location = [agency.city, agency.country].filter(Boolean).join(', ')
            return (
              <div key={agency.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                <span className="bg-emerald-50 text-emerald-800 font-bold text-xs sm:text-[10px] px-2 py-0.5 rounded border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 inline-block">
                  ✓ En la lista oficial del DOL
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{agency.agency_name}</h3>
                {location && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">📍 <strong className="text-slate-800 dark:text-slate-200">{location}</strong></p>
                )}

                {webLink ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <span>🌐</span>
                    <a
                      href={webLink.startsWith('http') ? webLink : `https://${webLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium truncate max-w-[180px]"
                      title={webLink}
                    >
                      {webLink.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1">
                    Sin sitio web en la lista oficial — no significa que algo esté mal, el DOL no lo pide para todas.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Pagination
        page={agencyPage}
        totalPages={totalAgencyPages}
        totalItems={totalAgenciesCount}
        itemLabel="agencias"
        disabled={isLoading}
        onChange={setAgencyPage}
      />
    </div>
  )
}
