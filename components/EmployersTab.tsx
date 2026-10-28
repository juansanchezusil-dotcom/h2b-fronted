'use client'

import type { Dispatch, SetStateAction } from 'react'
import { ShieldCheck, Search, MapPin } from 'lucide-react'
import Pagination from '@/components/Pagination'
import { US_STATES, type SponsorCompany } from '@/lib/h2b'

interface EmployersTabProps {
  employers: SponsorCompany[]
  isLoading: boolean
  totalEmployersCount: number
  totalCompanyPages: number
  companyPage: number
  setCompanyPage: Dispatch<SetStateAction<number>>
  companySearch: string
  setCompanySearch: Dispatch<SetStateAction<string>>
  selectedCompanyState: string
  setSelectedCompanyState: Dispatch<SetStateAction<string>>
  selectedCompanySector: string
  setSelectedCompanySector: Dispatch<SetStateAction<string>>
  selectedCapType: string
  setSelectedCapType: Dispatch<SetStateAction<string>>
  viewJobsFor: (sponsorId: number, employerName: string) => void
}

export default function EmployersTab({
  employers,
  isLoading,
  totalEmployersCount,
  totalCompanyPages,
  companyPage,
  setCompanyPage,
  companySearch,
  setCompanySearch,
  selectedCompanyState,
  setSelectedCompanyState,
  selectedCompanySector,
  setSelectedCompanySector,
  selectedCapType,
  setSelectedCapType,
  viewJobsFor,
}: EmployersTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Empresas Patrocinadoras (USCIS)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Historial real de USCIS: <strong className="text-slate-900 dark:text-white">{totalEmployersCount} empresas con estos filtros</strong> ya
              tuvieron visas H-2B aprobadas. Si tienen una vacante publicada ahora, te llevamos directo a ella.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3.5" />
            <input
              type="text"
              aria-label="Buscar empresa por nombre o ciudad"
              value={companySearch}
              onChange={(e) => {
                setCompanySearch(e.target.value)
                setCompanyPage(1)
              }}
              placeholder="Buscar por nombre o ciudad..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          <select
            aria-label="Tipo de cupo"
            value={selectedCapType}
            onChange={(e) => {
              setSelectedCapType(e.target.value)
              setCompanyPage(1)
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
          >
            <option value="ALL">Todas las Temporadas / Cap Type</option>
            <option value="1st Half">❄️ Invierno (1st Half)</option>
            <option value="2nd Half">☀️ Verano (2nd Half)</option>
            <option value="Exempt">🛡️ Exempt (Exentas)</option>
            <option value="Supplement">⚡ Supplement (Suplementarias)</option>
          </select>
          {/* SELECTOR COMPLETO DE ESTADOS PARA EMPRESAS */}
          <select
            aria-label="Estado de EE. UU."
            value={selectedCompanyState}
            onChange={(e) => {
              setSelectedCompanyState(e.target.value)
              setCompanyPage(1)
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
          >
            <option value="ALL">Todos los Estados (EE. UU.)</option>
            {US_STATES.map((st) => (
              <option key={st.code} value={st.code}>
                {st.name} ({st.code})
              </option>
            ))}
          </select>
          <select
            aria-label="Sector de la empresa"
            value={selectedCompanySector}
            onChange={(e) => {
              setSelectedCompanySector(e.target.value)
              setCompanyPage(1)
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
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
        </div>
      </div>

      {isLoading ? (
        // Esqueletos: tarjetas en celular, filas de tabla en escritorio
        <div role="status" aria-label="Cargando empresas">
          <div className="md:hidden space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5 motion-safe:animate-pulse">
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/70" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-800/70" />
                  <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-800/70" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 motion-safe:animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-6 px-5 py-4">
                <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-1/6 rounded bg-slate-100 dark:bg-slate-800/70" />
                <div className="h-3 w-1/6 rounded bg-slate-100 dark:bg-slate-800/70" />
                <div className="h-3 w-1/12 rounded bg-slate-100 dark:bg-slate-800/70" />
                <div className="ml-auto h-8 w-24 rounded-lg bg-slate-100 dark:bg-slate-800/70" />
              </div>
            ))}
          </div>
          <span className="sr-only">Cargando empresas...</span>
        </div>
      ) : (
        <>
          {/* CELULAR: tarjetas apiladas — una tabla de 6 columnas no cabe en 390px */}
          <div className="md:hidden space-y-3">
            {employers.map((comp, idx) => {
              const abroad = String(comp.consular_processed || '').toLowerCase() === 'yes'
              return (
                <div key={comp.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{comp.employer_name || 'Sin Nombre'}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`font-bold px-2 py-0.5 rounded text-xs sm:text-[10px] border ${comp.cap_type?.includes('1st Half') ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30' :
                        comp.cap_type?.includes('2nd Half') ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30' :
                          comp.cap_type?.includes('Exempt') ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30' :
                            'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                      }`}>
                      {comp.cap_type || 'General'}
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded text-xs sm:text-[10px] border ${abroad ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                      {abroad ? '🌎 Contrata desde el extranjero' : 'Solo contrató dentro de EE. UU.'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{comp.worksite_states || comp.state || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{comp.total_approved || 0} visas aprobadas</span>
                    </div>
                  </div>
                  {comp.jobs && comp.jobs.length > 0 ? (
                    <button
                      onClick={() => viewJobsFor(Number(comp.id), comp.employer_name || '')}
                      className="w-full bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs py-2 rounded-xl transition-all"
                    >
                      Ver {comp.jobs.length === 1 ? 'su vacante' : `sus ${comp.jobs.length} vacantes`}
                    </button>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic text-center py-1.5">Sin vacantes publicadas ahora</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* ESCRITORIO: tabla completa */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-xs sm:text-[10px]">
                  <tr>
                    <th className="p-4">Empresa Patrocinadora</th>
                    <th className="p-4">Tipo de Cupo (Cap)</th>
                    <th className="p-4">Ubicación</th>
                    <th className="p-4">Consular Processed</th>
                    <th className="p-4">Visas Aprobadas</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {employers.map((comp, idx) => (
                    <tr key={comp.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{comp.employer_name || 'Sin Nombre'}</td>
                      <td className="p-4">
                        <span className={`font-bold px-2 py-0.5 rounded text-xs sm:text-[10px] ${comp.cap_type?.includes('1st Half') ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30' :
                            comp.cap_type?.includes('2nd Half') ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30' :
                              comp.cap_type?.includes('Exempt') ? 'bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30' :
                                'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                          }`}>
                          {comp.cap_type || 'General'}
                        </span>
                      </td>
                      <td className="p-4">{comp.worksite_states || comp.state || '-'}</td>
                      <td className="p-4 font-semibold">{comp.consular_processed ?? 0}</td>
                      <td className="p-4 font-semibold">{comp.total_approved || 0} visas</td>
                      <td className="p-4 text-right">
                        {comp.jobs && comp.jobs.length > 0 ? (
                          <button
                            onClick={() => viewJobsFor(Number(comp.id), comp.employer_name || '')}
                            className="bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all"
                          >
                            Ver {comp.jobs.length === 1 ? 'su vacante' : `sus ${comp.jobs.length} vacantes`}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">Sin vacantes ahora</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Pagination
        page={companyPage}
        totalPages={totalCompanyPages}
        totalItems={totalEmployersCount}
        itemLabel="empresas"
        disabled={isLoading}
        onChange={setCompanyPage}
      />
    </div>
  )
}
