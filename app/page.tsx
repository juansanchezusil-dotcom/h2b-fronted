'use client'
import { useState, useEffect, useRef } from 'react'

import OnboardingModal from '@/components/OnboardingModal';
import UserMenu from '@/components/UserMenu';
import {
  Briefcase,
  Building2,
  ShieldCheck,
  Send,
  CheckCircle2,
  Search,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  MoveRight,
  TrendingUp,
  FileText,
  UserCheck,
  Globe,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  StickyNote,
  XCircle,
  CheckCircle,
  X,
  Mail,
} from 'lucide-react'
import { AnimatedProgressCardDemo } from '@/components/AnimatedProgressCardDemo'
import { EmailAssistantTab } from '../components/EmailAssistantTab'
import RoadmapChecklist, { readChecklistSteps, CHECKLIST_TOTAL_TASKS } from '@/components/RoadmapChecklist';
import InfoTooltip from '@/components/InfoTooltip';
import Pagination from '@/components/Pagination';
import SponsorHistory from '@/components/SponsorHistory';
import CVBuilderModal from '@/components/CVBuilderModal';
import ApplyFlowModal from '@/components/ApplyFlowModal';
import { useBackToClose } from '@/hooks/useBackToClose';
// LISTA COMPLETA DE ESTADOS DE EE. UU. Y TERRITORIOS
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'GU', name: 'Guam' },
  { code: 'VI', name: 'Virgin Islands' },
]

// Cliente Supabase (instancia única para evitar duplicación de cliente)
import { supabase } from '@/lib/supabaseClient'

// Interfaces ajustadas a la BBDD real
interface Job {
  id?: string | number
  job_order_id?: string
  title?: string
  employer_name?: string
  location?: string
  city?: string
  state?: string
  wage?: string
  begin_date?: string
  end_date?: string
  workers_requested?: number
  email_to_apply?: string
  industry?: string
  phone_number?: string
  job_description?: string
  full_time?: string | boolean
  job_order_url?: string
  [key: string]: any
}

interface SponsorCompany {
  id?: string | number
  employer_name?: string
  state?: string
  worksite_states?: string
  city?: string
  approval_rate?: string
  petition_count?: number
  consular_processed?: number | string
  total_approved?: number
  fiscal_year?: string
  cap_type?: string
  // Vacantes del catálogo ya vinculadas a esta empresa (ver linkJobs.ts)
  jobs?: { id: number; title: string; location: string }[]
  [key: string]: any
}

// Lista oficial del DOL de reclutadores/agentes extranjeros declarados para H-2B
// (transparencia contra fraude, no un directorio de servicios). La tabla real
// solo trae estas columnas — no hay correo, sitio "oficial" alterno ni estado,
// aunque el nombre sugiera lo contrario.
interface SponsorAgency {
  id?: string | number
  agency_name?: string
  city?: string
  country?: string
  case_count?: number
  website?: string
  [key: string]: any
}

// ===== CRM: Centro de Comando Kanban expandido =====
interface CRMItem {
  id: string
  company: string
  role: string
  state: string
  status: 'guardadas' | 'postulado' | 'seguimiento' | 'entrevista' | 'aceptado' | 'rechazada' | 'no_respondido'
  dateLabel: string
  lastUpdated: number
  // Fecha real de postulación: el cron cuenta los días 7-14-21 desde aquí
  createdAt: number
  notes?: string
}

// Cada oferta viene del scraper diario del DOL o de la carga de CareerOneStop (columna "source")
const sourceInfo = (source?: string) =>
  source === 'CareerOneStop'
    ? {
        label: 'CareerOneStop',
        tooltip: 'Oferta H-2B publicada en CareerOneStop, el portal de empleo del Departamento de Trabajo de EE. UU. La revisamos y la reunimos aquí junto a las demás para que no tengas que buscar en varios sitios.',
      }
    : {
        label: 'DOL',
        tooltip: 'Oferta con certificación laboral H-2B del Departamento de Trabajo de EE. UU. (DOL). La tomamos del registro oficial cada día y la reunimos aquí con sus datos de contacto para que postules directo.',
      }

type Tab = 'dashboard' | 'jobs' | 'employers' | 'agencies' | 'crm' | 'ai' | 'checklist'
const TABS: Tab[] = ['dashboard', 'jobs', 'employers', 'agencies', 'crm', 'ai', 'checklist']

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  // --- ESTADOS DE DATOS REALES ---
  const [jobs, setJobs] = useState<Job[]>([])
  const [totalJobsCount, setTotalJobsCount] = useState<number>(0)
  const [employers, setEmployers] = useState<SponsorCompany[]>([])
  const [totalEmployersCount, setTotalEmployersCount] = useState<number>(0)
  const [agencies, setAgencies] = useState<SponsorAgency[]>([])
  const [totalAgenciesCount, setTotalAgenciesCount] = useState<number>(0)
  // Totales del catálogo completo (sin filtros): no cambian al buscar
  const [catalogTotals, setCatalogTotals] = useState({ jobs: 0, employers: 0, agencies: 0 })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  useBackToClose(!!selectedJob, () => setSelectedJob(null))
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [onboardingUserId, setOnboardingUserId] = useState<string>('')

  // --- FILTROS DE BÚSQUEDA INDEPENDIENTES ---
  const [jobSearch, setJobSearch] = useState('')
  const [selectedJobState, setSelectedJobState] = useState('ALL')
  const [selectedJobSector, setSelectedJobSector] = useState('ALL')
  // La contratación H-2B va adelantada a la temporada: en abr-sep se publican y se
  // llenan las vacantes que EMPIEZAN en octubre (Invierno), y en oct-mar las que
  // empiezan en abril (Verano). Lo confirmé contra datos reales: en septiembre hay
  // 1087 vacantes de Invierno por solo 2 de Verano. Por eso el mapeo es al revés
  // del calendario: se arranca en la temporada que SÍ tiene vacantes activas ahora.
  const [selectedSeason, setSelectedSeason] = useState(() => {
    const month = new Date().getMonth() // 0=enero
    return month >= 3 && month <= 8 ? 'WINTER' : 'SUMMER'
  })
  const [onlyHiresAbroad, setOnlyHiresAbroad] = useState(false)
  const [jobSortBy, setJobSortBy] = useState<'recent' | 'match'>('recent')
  // Cuando se llega a Ofertas desde "Ver sus vacantes" en Empresas: filtro exacto
  // por sponsor_company_id, no por nombre de texto (ver nota en viewJobsFor)
  const [sponsorFilter, setSponsorFilter] = useState<{ id: number; name: string } | null>(null)

  const [companySearch, setCompanySearch] = useState('')
  const [selectedCompanyState, setSelectedCompanyState] = useState('ALL')
  const [selectedCompanySector, setSelectedCompanySector] = useState('ALL')
  const [selectedCapType, setSelectedCapType] = useState('ALL')

  const [agencySearch, setAgencySearch] = useState('')
  const [selectedAgencyCountry, setSelectedAgencyCountry] = useState('ALL')

  // --- PAGINACIÓN ---
  const ITEMS_PER_PAGE = 20
  // Ofertas en bloques de 21: la grilla es de 3 columnas, así cada página llena 7 filas completas
  const JOBS_PER_PAGE = 21
  const [jobPage, setJobPage] = useState(1)
  const [companyPage, setCompanyPage] = useState(1)
  const [agencyPage, setAgencyPage] = useState(1)

  // Extractor IA
  const [extractUrl, setExtractUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // ===== CRM =====
  const [crmItems, setCrmItems] = useState<CRMItem[]>([])
  const [crmLoading, setCrmLoading] = useState(true)
  // Un fallo al cargar no debe verse como "no tienes postulaciones"
  const [crmError, setCrmError] = useState(false)
  const savingCrmKeys = useRef(new Set<string>())
  const [savingCrmKey, setSavingCrmKey] = useState<string | null>(null)
  const [isSavingManual, setIsSavingManual] = useState(false)
  const [showEmailAssistant, setShowEmailAssistant] = useState(false)
  const [hasCv, setHasCv] = useState(false)
  const [showCvBuilder, setShowCvBuilder] = useState(false)
  // Empresa/puesto que precargan el redactor cuando se abre desde una tarjeta del CRM
  const [emailDraftFor, setEmailDraftFor] = useState<{ company: string; role: string } | null>(null)
  // Oferta que se está postulando ahora mismo (flujo "Postular ahora" del detalle)
  const [applyFlowJob, setApplyFlowJob] = useState<{ title: string; employerName: string; location?: string; contactEmail?: string } | null>(null)

  const refreshHasCv = async (userId: string) => {
    if (!userId) return
    const { data } = await supabase.from('profiles').select('base_cv_text').eq('id', userId).maybeSingle()
    setHasCv((data?.base_cv_text || '').trim().length >= 30)
  }
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }
  // Cargar las postulaciones reales del usuario desde Supabase
  useEffect(() => {
  if (!onboardingUserId) return

  async function loadApplications() {
    setCrmLoading(true)

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', onboardingUserId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const mapped: CRMItem[] = data.map((row: any) => ({
        id: row.id,
        company: row.company_name,
        role: row.job_title || 'Vacante H2B',
        state: row.state || 'US',
        status: row.status as CRMItem['status'],
        dateLabel: labelForStatus(row.status),
        lastUpdated: new Date(row.last_updated || row.created_at).getTime(),
        createdAt: new Date(row.created_at).getTime(),
        notes: row.notes || '',
      }))
      setCrmItems(mapped)
      setCrmError(false)
    } else if (error) {
      console.error('Error cargando postulaciones:', error)
      setCrmError(true)
    }
    setCrmLoading(false)
  }

  loadApplications()

  // ===== NUEVO: Realtime =====
  // Cuando el cron (u otra pestaña, u otro dispositivo) cambia algo en
  // "applications" para este usuario, volvemos a cargar automáticamente.
  // No intentamos mezclar el cambio a mano: simplemente re-consultamos,
  // que es más simple y seguro que reconstruir el estado a partir del
  // payload del evento.
  const channel = supabase
    .channel(`applications-user-${onboardingUserId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'applications',
        filter: `user_id=eq.${onboardingUserId}`,
      },
      () => {
        loadApplications()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [onboardingUserId])

const labelForStatus = (status: string) => {
  const labels: Record<string, string> = {
    guardadas: 'Guardado recientemente',
    postulado: 'Postulado',
    seguimiento: 'En seguimiento',
    entrevista: 'En entrevista',
    aceptado: '¡Oferta aceptada!',
    rechazada: 'Rechazado',
    no_respondido: 'No respondido',
  }
  return labels[status] || 'Actualizado'
}
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState<string>('')

  // Modal Postulación Manual
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  useBackToClose(isManualModalOpen, () => setIsManualModalOpen(false))
  const [manualCompany, setManualCompany] = useState('')
  const [manualRole, setManualRole] = useState('')
  const [manualState, setManualState] = useState('')
  const [manualStatus, setManualStatus] = useState<CRMItem['status']>('guardadas')

  const handleSaveManualItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCompany.trim() || !onboardingUserId || isSavingManual) return
    setIsSavingManual(true)

    const { data, error } = await supabase
      .from('applications')
      .insert({
        user_id: onboardingUserId,
        company_name: manualCompany.trim(),
        job_title: manualRole.trim() || 'Vacante H2B',
        state: manualState.trim() || 'US',
        status: manualStatus || 'guardadas',
        notes: '',
      })
      .select()
      .single()

    setIsSavingManual(false)

    if (error || !data) {
      console.error('Error guardando postulación manual:', error)
      showToast('❌ No se pudo guardar la postulación.')
      return
    }

    const newItem: CRMItem = {
      id: data.id,
      company: data.company_name,
      role: data.job_title,
      state: data.state,
      status: data.status,
      dateLabel: labelForStatus(data.status),
      lastUpdated: new Date(data.created_at).getTime(),
    createdAt: new Date(data.created_at).getTime(),
      notes: '',
    }

    setCrmItems(prev => [newItem, ...prev])
    showToast(`✅ "${newItem.company}" agregada a tu CRM.`)

  setManualCompany('')
  setManualRole('')
  setManualState('')
  setManualStatus('guardadas')
  setIsManualModalOpen(false)
}
useEffect(() => {
  async function checkUserProfile() {
    console.log('🔍 Verificando perfil...')

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('👤 Usuario:', user, 'Error de auth:', userError)

    if (user) {
      setOnboardingUserId(user.id)
      refreshHasCv(user.id)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('perfil_completado')
        .eq('id', user.id)
        .maybeSingle()

      console.log('📋 Perfil encontrado:', profile, 'Error de consulta:', error)

const isComplete = !error && !!profile && profile.perfil_completado === true
setProfileCompleted(isComplete)

if (!isComplete) {
  console.log('✅ Debería mostrar el modal ahora')
  setShowOnboarding(true)
} else {
  console.log('❌ NO se muestra: perfil ya está completado')
}
    } else {
      console.log('❌ NO hay usuario logueado, el modal nunca se activa')
    }
  }
  checkUserProfile()
}, [])

// ===== CHECKLIST =====
// El avance vive en RoadmapChecklist (guardado en el navegador); aquí solo se lee
// para el recuadro del dashboard, cada vez que se vuelve a una pestaña.
const [checklistDone, setChecklistDone] = useState(0)
useEffect(() => {
  const manual = Object.values(readChecklistSteps(onboardingUserId)).filter(Boolean).length
  setChecklistDone((profileCompleted ? 1 : 0) + manual)
}, [activeTab, onboardingUserId, profileCompleted])

const [matchScores, setMatchScores] = useState<Record<string, { score: number; breakdown: any }>>({})

useEffect(() => {
  async function loadMatchScores() {
    if (!onboardingUserId) return
    try {
      const res = await fetch('/api/jobs/matches')
      if (!res.ok) return
      const data = await res.json()
      const map: Record<string, { score: number; breakdown: any }> = {}
      data.forEach((row: any) => {
        map[row.job_id] = { score: row.match_score, breakdown: row.match_breakdown }
      })
      setMatchScores(map)
    } catch (err) {
      console.error('Error cargando match scores:', err)
    }
  }
  loadMatchScores()
}, [onboardingUserId])

// CARGA INICIAL DE TOTALES
useEffect(() => {
  const fetchInitialCounts = async () => {
    const { count: cJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
    if (cJobs !== null) { setTotalJobsCount(cJobs); setCatalogTotals(t => ({ ...t, jobs: cJobs })) }

    const { count: cEmployers } = await supabase
      .from('sponsor_companies')
      .select('*', { count: 'exact', head: true })
    if (cEmployers !== null) { setTotalEmployersCount(cEmployers); setCatalogTotals(t => ({ ...t, employers: cEmployers })) }

    const { count: cAgencies } = await supabase
      .from('sponsor_agencies')
      .select('*', { count: 'exact', head: true })
    if (cAgencies !== null) { setTotalAgenciesCount(cAgencies); setCatalogTotals(t => ({ ...t, agencies: cAgencies })) }
  }
  fetchInitialCounts()
}, [])

// CONSULTAS DE OFERTAS LABORALES
useEffect(() => {
  const fetchJobs = async () => {
    setIsLoading(true)
    const from = (jobPage - 1) * JOBS_PER_PAGE
    const to = from + JOBS_PER_PAGE - 1
    // Trae el historial de USCIS de la empresa vinculada. Con el filtro activo, el join es
    // obligatorio (!inner) y solo quedan empresas que tramitaron visas en consulados.
    const sponsorColumns = 'employer_name, consular_processed, total_approved, cap_type'
    let query = supabase
      .from('jobs')
      .select(
        onlyHiresAbroad
          ? `*, sponsor:sponsor_companies!inner(${sponsorColumns})`
          : `*, sponsor:sponsor_companies(${sponsorColumns})`,
        { count: 'exact' }
      )
      .order('begin_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false });

    if (onlyHiresAbroad) {
      query = query
        .in('sponsor_match', ['exacta', 'probable', 'otro_estado'])
        .eq('sponsor.consular_processed', 'Yes')
    }

    if (sponsorFilter) {
      query = query.eq('sponsor_company_id', sponsorFilter.id)
    }

    if (selectedJobState && selectedJobState !== 'ALL') {
      const match = selectedJobState.match(/\(([^)]+)\)/)
      const stateCode = match ? match[1] : selectedJobState.trim()
      query = query.ilike('location', `%, ${stateCode}%`)
    }

    if (jobSearch && jobSearch.trim() !== '') {
      // Busca en puesto, empresa y ciudad, como promete el campo. Cada palabra puede estar
      // en cualquiera de los tres ("cook vail" = puesto Cook en Vail). Se quitan comas,
      // puntos y paréntesis porque rompen la sintaxis del filtro "or" de Supabase.
      const words = jobSearch.replace(/[,.()]/g, ' ').split(/\s+/).filter(w => w.length >= 2)
      for (const w of words) {
        query = query.or(`title.ilike.%${w}%,employer_name.ilike.%${w}%,location.ilike.%${w}%`)
      }
    }

    // Filtro de Temporadas H-2B por fecha de inicio (begin_date, texto "DD-Mon-YYYY").
    // Sin año: mira solo el mes, así no hay que tocar esto cada año.
    if (selectedSeason === 'WINTER') {
      // Invierno (1st Half): inicia entre octubre y marzo
      query = query.or(
        `begin_date.ilike.%Oct%,begin_date.ilike.%Nov%,begin_date.ilike.%Dec%,begin_date.ilike.%Jan%,begin_date.ilike.%Feb%,begin_date.ilike.%Mar%`
      );
    } else if (selectedSeason === 'SUMMER') {
      // Verano (2nd Half): inicia entre abril y septiembre
      query = query.or(
        `begin_date.ilike.%Apr%,begin_date.ilike.%May%,begin_date.ilike.%Jun%,begin_date.ilike.%Jul%,begin_date.ilike.%Aug%,begin_date.ilike.%Sep%`
      );
    }

    if (selectedJobSector && selectedJobSector !== 'ALL') {
      const sectorVal = selectedJobSector.toLowerCase()
      let synonyms: string[] = []
      if (sectorVal.includes('construc')) {
        synonyms = ['Construction', 'Builder', 'Concrete', 'Carpenter', 'Laborer']
      } else if (sectorVal.includes('agricultur') || sectorVal.includes('agro')) {
        synonyms = ['Agriculture', 'Farm', 'Crop', 'Harvest', 'Agricultural']
      } else if (sectorVal.includes('hoteler') || sectorVal.includes('turism') || sectorVal.includes('hotel')) {
        synonyms = ['Hospitality', 'Hotel', 'Resort', 'Tourism', 'Housekeeping', 'Housekeeper', 'Attendant', 'Laundry', 'Room', 'Front Desk', 'Maintenance']
      } else if (sectorVal.includes('paisaj') || sectorVal.includes('landscape')) {
        synonyms = ['Landscape', 'Grounds', 'Garden', 'Tree', 'Lawn']
      } else if (sectorVal.includes('cocina') || sectorVal.includes('alimento') || sectorVal.includes('restaurante') || sectorVal.includes('food')) {
        synonyms = ['Food', 'Restaurant', 'Cook', 'Kitchen', 'Server', 'Dining', 'Prep', 'Line Cook', 'Chef', 'Dishwasher', 'Busser', 'Host']
      } else if (sectorVal.includes('limpieza') || sectorVal.includes('cleaning') || sectorVal.includes('janitor')) {
        synonyms = ['Cleaning', 'Janitor', 'Cleaner', 'Maid', 'Housekeeping']
      } else if (sectorVal.includes('manufactur') || sectorVal.includes('fabrica') || sectorVal.includes('warehouse')) {
        synonyms = ['Manufacturing', 'Factory', 'Production', 'Assembly', 'Warehouse']
      } else {
        synonyms = [selectedJobSector]
      }
      const conditions = synonyms.map(word => `title.ilike.%${word}%`).join(',')
      query = query.or(conditions)
    }

    const { data, count, error } = await query
      .range(from, to)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })

    if (!error && data) {
      setJobs(data)
      setTotalJobsCount(count || 0)
    } else {
      console.error('Error al buscar en Supabase:', error?.message || error)
    }
    setIsLoading(false)
  }

  const timer = setTimeout(() => {
    fetchJobs()
  }, 300)

  return () => clearTimeout(timer)
}, [jobSearch, selectedJobState, selectedJobSector, selectedSeason, onlyHiresAbroad, sponsorFilter, jobPage])

// Orden dentro de la página ya cargada: "match" pone primero lo más compatible
// con tu perfil (requiere haber completado el perfil, si no todas quedan en 0).
const filteredJobs = jobSortBy === 'match'
  ? [...jobs].sort((a, b) => (matchScores[String(b.id)]?.score ?? -1) - (matchScores[String(a.id)]?.score ?? -1))
  : jobs

// CONSULTAS DE EMPRESAS USCIS
useEffect(() => {
  const fetchEmployers = async () => {
    if (activeTab !== 'employers') return
    setIsLoading(true)

    let countQuery = supabase
      .from('sponsor_companies')
      .select('*', { count: 'exact', head: true })

    if (companySearch && companySearch.trim() !== '') {
      const term = companySearch.trim()
      countQuery = countQuery.or(`employer_name.ilike.%${term}%,city.ilike.%${term}%`)
    }
    if (selectedCompanyState && selectedCompanyState !== 'ALL') {
      const match = selectedCompanyState.match(/\(([^)]+)\)/)
      const stateCode = match ? match[1] : selectedCompanyState.trim()
      countQuery = countQuery.or(`worksite_states.ilike.%${stateCode}%,state.ilike.%${stateCode}%`)
    }
    if (selectedCapType && selectedCapType !== 'ALL') {
      countQuery = countQuery.ilike('cap_type', `%${selectedCapType}%`)
    }
    if (selectedCompanySector && selectedCompanySector !== 'ALL') {
      const sectorVal = selectedCompanySector.toLowerCase()
      let searchTerm = sectorVal
      if (sectorVal.includes('construc')) searchTerm = '23'
      else if (sectorVal.includes('agricultur')) searchTerm = '11'
      else if (sectorVal.includes('hoteler') || sectorVal.includes('restaurant')) searchTerm = '72'
      else if (sectorVal.includes('paisaj') || sectorVal.includes('landscape')) searchTerm = '56'
      else if (sectorVal.includes('limpieza') || sectorVal.includes('housekeeping')) searchTerm = '37'
      else if (sectorVal.includes('cocina') || sectorVal.includes('alimento')) searchTerm = 'Food'
      else if (sectorVal.includes('procesamiento')) searchTerm = 'Production'
      else if (sectorVal.includes('bodega') || sectorVal.includes('logística')) searchTerm = '48'
      else if (sectorVal.includes('fábrica') || sectorVal.includes('manufactura')) searchTerm = 'Manufacturing'
      countQuery = countQuery.or(`naics.ilike.%${searchTerm}%,soc.ilike.%${searchTerm}%`)
    }

    const { count } = await countQuery
    const realTotal = count || 0
    setTotalEmployersCount(realTotal)

    const maxPages = Math.ceil(realTotal / ITEMS_PER_PAGE) || 1
    const safePage = companyPage > maxPages ? 1 : companyPage
    if (safePage !== companyPage) {
      setCompanyPage(1)
      setIsLoading(false)
      return
    }

    const from = (safePage - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1
    // jobs!sponsor_company_id trae las vacantes del catálogo ya vinculadas a esta
    // empresa (ver src/sponsors/linkJobs.ts en el backend) — sin esto no hay forma
    // de saber si "guardar" esta empresa lleva a algo real.
    let query = supabase.from('sponsor_companies').select('*, jobs!sponsor_company_id(id, title, location)')

    if (companySearch && companySearch.trim() !== '') {
      const term = companySearch.trim()
      query = query.or(`employer_name.ilike.%${term}%,city.ilike.%${term}%`)
    }
    if (selectedCompanyState && selectedCompanyState !== 'ALL') {
      const match = selectedCompanyState.match(/\(([^)]+)\)/)
      const stateCode = match ? match[1] : selectedCompanyState.trim()
      query = query.or(`worksite_states.ilike.%${stateCode}%,state.ilike.%${stateCode}%`)
    }
    if (selectedCapType && selectedCapType !== 'ALL') {
      query = query.ilike('cap_type', `%${selectedCapType}%`)
    }
    if (selectedCompanySector && selectedCompanySector !== 'ALL') {
      const sectorVal = selectedCompanySector.toLowerCase()
      let searchTerm = sectorVal
      if (sectorVal.includes('construc')) searchTerm = '23'
      else if (sectorVal.includes('agricultur')) searchTerm = '11'
      else if (sectorVal.includes('hoteler') || sectorVal.includes('restaurant')) searchTerm = '72'
      else if (sectorVal.includes('paisaj') || sectorVal.includes('landscape')) searchTerm = '56'
      else if (sectorVal.includes('limpieza') || sectorVal.includes('housekeeping')) searchTerm = '37'
      else if (sectorVal.includes('cocina') || sectorVal.includes('alimento')) searchTerm = 'Food'
      else if (sectorVal.includes('procesamiento')) searchTerm = 'Production'
      else if (sectorVal.includes('bodega') || sectorVal.includes('logística')) searchTerm = '48'
      else if (sectorVal.includes('fábrica') || sectorVal.includes('manufactura')) searchTerm = 'Manufacturing'
      query = query.or(`naics.ilike.%${searchTerm}%,soc.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query
      .range(from, to)
      .order('employer_name', { ascending: true })

    if (!error && data) {
      setEmployers(data)
    } else {
      console.error('Error al buscar empresas en Supabase:', error?.message || error)
    }
    setIsLoading(false)
  }

  const timer = setTimeout(() => {
    fetchEmployers()
  }, 300)

  return () => clearTimeout(timer)
}, [companySearch, selectedCompanyState, selectedCompanySector, selectedCapType, companyPage, activeTab])

// CONSULTAS DE AGENCIAS DOL
useEffect(() => {
  const fetchAgencies = async () => {
    if (activeTab !== 'agencies') return
    setIsLoading(true)
    const from = (agencyPage - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    let query = supabase
      .from('sponsor_agencies')
      .select('*', { count: 'exact' })
    if (agencySearch) {
      query = query.or(`agency_name.ilike.%${agencySearch}%,country.ilike.%${agencySearch}%,city.ilike.%${agencySearch}%`)
    }
    // Filtro dinámico por país
    if (selectedAgencyCountry && selectedAgencyCountry !== 'ALL') {
      query = query.ilike('country', `%${selectedAgencyCountry}%`)
    }
    const { data, count, error } = await query
      .order('website', { ascending: false, nullsFirst: false })
      .order('agency_name', { ascending: true })
      .range(from, to)
    if (!error && data) {
      setAgencies(data as SponsorAgency[])
      if (count !== null) setTotalAgenciesCount(count)
    }
    setIsLoading(false)
  }
  fetchAgencies()
}, [activeTab, agencyPage, agencySearch, selectedAgencyCountry])

// ACCIONES CRM
const crmKey = (company: string, role: string) => `${company}|${role}`.trim().toLowerCase()

const addToCRM = async (company?: string, role?: string, stateStr?: string): Promise<boolean> => {
  if (!onboardingUserId) return false
  const compName = company || 'Empresa Generica'
  const roleName = role || 'Vacante H2B'
  const key = crmKey(compName, roleName)

  // Evita el duplicado por doble toque (el ref cambia al instante, el estado no)
  if (savingCrmKeys.current.has(key)) return false
  if (crmItems.some(i => crmKey(i.company, i.role) === key)) {
    showToast(`"${compName}" ya está en tu CRM.`)
    return false
  }
  savingCrmKeys.current.add(key)
  setSavingCrmKey(key)

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: onboardingUserId,
      company_name: compName,
      job_title: roleName,
      state: stateStr || 'US',
      status: 'guardadas',
      notes: '',
    })
    .select()
    .single()

  savingCrmKeys.current.delete(key)
  setSavingCrmKey(null)

  if (error || !data) {
    console.error('Error guardando en CRM:', error)
    showToast('❌ No se pudo guardar. Intenta de nuevo.')
    return false
  }

  const newItem: CRMItem = {
    id: data.id,
    company: data.company_name,
    role: data.job_title,
    state: data.state,
    status: 'guardadas',
    dateLabel: labelForStatus('guardadas'),
    lastUpdated: new Date(data.created_at).getTime(),
    createdAt: new Date(data.created_at).getTime(),
    notes: '',
  }
  setCrmItems(prev => [newItem, ...prev])
  showToast(`✅ "${compName}" fue agregada a tu CRM.`)
  return true
}

// Busca la oferta del enlace en nuestro catálogo del DOL por su Job Order ID
// (ej. H-300-26123-456789). No inventa datos: si no está, lo dice.
const handleExtract = async () => {
  const match = extractUrl.match(/H-\d{3}-\d{5}-\d{5,}/i)
  if (!match) {
    showToast('❌ Ese enlace no tiene un Job Order ID (ej. H-300-26123-456789).')
    return
  }
  setIsProcessing(true)
  const { data: job, error } = await supabase
    .from('jobs')
    .select('employer_name, title, location')
    .ilike('case_number', match[0])
    .maybeSingle()
  setIsProcessing(false)

  if (error) {
    console.error('Error buscando la oferta:', error)
    showToast('❌ No se pudo buscar la oferta. Intenta de nuevo.')
    return
  }
  if (!job) {
    showToast(`Aún no tenemos ${match[0].toUpperCase()} en el catálogo. Agrégala a mano desde Mi CRM.`)
    return
  }
  if (await addToCRM(job.employer_name, job.title, job.location)) setExtractUrl('')
}

const changeCrmStatus = async (id: string, newStatus: CRMItem['status']) => {
  const previous = crmItems.find(item => item.id === id)
  // Actualización optimista: se ve el cambio de inmediato en pantalla
  setCrmItems(prev => prev.map(item =>
    item.id === id
      ? { ...item, status: newStatus, dateLabel: labelForStatus(newStatus), lastUpdated: Date.now() }
      : item
  ))

  const { error } = await supabase
    .from('applications')
    .update({ status: newStatus, last_updated: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error actualizando estado en CRM:', error)
    // Si no se guardó, la tarjeta vuelve a su columna: la pantalla no puede mentir
    if (previous) setCrmItems(prev => prev.map(item => item.id === id ? previous : item))
    showToast('❌ No se pudo actualizar el estado. Intenta de nuevo.')
  }
}

// Se llama cuando el flujo de "Postular ahora" confirma que el correo se envió.
// Si la oferta ya estaba guardada, la avanza a Postulado; si no existía en el
// CRM, la crea directo ahí — nunca se aplica sin que quede registro.
const applyJobToCrm = async (job: { title: string; employerName: string; location?: string }) => {
  if (!onboardingUserId) return
  const key = crmKey(job.employerName, job.title)
  const existing = crmItems.find(i => crmKey(i.company, i.role) === key)

  if (existing) {
    if (existing.status === 'guardadas') await changeCrmStatus(existing.id, 'postulado')
    return
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: onboardingUserId,
      company_name: job.employerName,
      job_title: job.title,
      state: job.location || 'US',
      status: 'postulado',
      notes: '',
    })
    .select()
    .single()

  if (error || !data) {
    console.error('Error registrando postulación:', error)
    showToast('❌ El correo se envió, pero no se pudo guardar en tu CRM.')
    return
  }

  const newItem: CRMItem = {
    id: data.id,
    company: data.company_name,
    role: data.job_title,
    state: data.state,
    status: 'postulado',
    dateLabel: labelForStatus('postulado'),
    lastUpdated: new Date(data.created_at).getTime(),
    createdAt: new Date(data.created_at).getTime(),
    notes: '',
  }
  setCrmItems(prev => [newItem, ...prev])
  showToast(`✅ Postulación a "${job.employerName}" registrada en tu CRM.`)
}

// Abre el redactor de correos precargado con la empresa/puesto de esta tarjeta del CRM
// Salta de Empresas a Ofertas, filtrado por el nombre de esa empresa.
// La búsqueda de Ofertas ya reconoce empleador, así que solo hace falta esto.
// Filtra por sponsor_company_id (el vínculo real que ya arma el backend), no por
// nombre de texto: el nombre de USCIS trae "DBA..." y a veces queda cortado a
// media palabra, y la búsqueda por texto exige que cada palabra calce en algún
// lado — con un nombre así, nunca encuentra la oferta real aunque sea la misma
// empresa.
const viewJobsFor = (sponsorId: number, employerName: string) => {
  setJobSearch('')
  setSponsorFilter({ id: sponsorId, name: employerName })
  setJobPage(1)
  setActiveTab('jobs')
}

const openEmailFor = (item: CRMItem) => {
  setEmailDraftFor({ company: item.company, role: item.role })
  setShowEmailAssistant(true)
  setActiveTab('ai')
}

const deleteCrmItem = async (id: string) => {
  const snapshot = crmItems
  setCrmItems(prev => prev.filter(item => item.id !== id))

  const { error } = await supabase.from('applications').delete().eq('id', id)
  if (error) {
    console.error('Error borrando postulación:', error)
    setCrmItems(snapshot)
    showToast('❌ No se pudo eliminar. Intenta de nuevo.')
  }
}

const saveNotes = async (id: string) => {
  const previousNotes = crmItems.find(item => item.id === id)?.notes || ''
  setCrmItems(prev => prev.map(item => item.id === id ? { ...item, notes: tempNotes } : item))
  setEditingNotesId(null)

  const { error } = await supabase
    .from('applications')
    .update({ notes: tempNotes })
    .eq('id', id)

  if (error) {
    console.error('Error guardando nota:', error)
    setCrmItems(prev => prev.map(item => item.id === id ? { ...item, notes: previousNotes } : item))
    showToast('❌ No se pudo guardar la nota.')
  }
  setTempNotes('')
}

const totalJobPages = Math.ceil(totalJobsCount / JOBS_PER_PAGE) || 1
const totalCompanyPages = Math.ceil(totalEmployersCount / ITEMS_PER_PAGE) || 1
const totalAgencyPages = Math.ceil(totalAgenciesCount / ITEMS_PER_PAGE) || 1
const checklistPercentage = Math.round((checklistDone / CHECKLIST_TOTAL_TASKS) * 100)
const weeklyTarget = 15
// Postulaciones movidas fuera de "guardadas" en los últimos 7 días (no el total histórico)
const applicationsThisWeek = crmItems.filter(i => i.status !== 'guardadas' && Date.now() - i.lastUpdated < 7 * 24 * 60 * 60 * 1000).length
const searchHealthPercentage = Math.min(100, Math.round((applicationsThisWeek / weeklyTarget) * 100))

// ===== TU PRIORIDAD (Next Best Action) =====
// Revisa las señales en orden y muestra solo la más urgente. No se calcula
// hasta que sepamos quién es el usuario y su CRM haya cargado, para no
// mostrar "aún no guardaste ninguna oferta" mientras todavía está cargando.
interface NextAction {
  icon: React.ElementType
  title: string
  desc: string
  buttonLabel: string
  onClick: () => void
}

const getNextAction = (): NextAction | null => {
  if (!onboardingUserId || crmLoading) return null

  if (!profileCompleted) {
    return {
      icon: UserCheck,
      title: 'Completa tu perfil',
      desc: 'Con tu industria, experiencia e inglés calculamos qué tan bien encajas con cada oferta.',
      buttonLabel: 'Completar perfil',
      onClick: () => setShowOnboarding(true),
    }
  }

  if (!hasCv) {
    return {
      icon: FileText,
      title: 'Genera tu CV en inglés',
      desc: 'Lo necesitas para postular en serio, y el redactor de correos lo usa para personalizar tus mensajes.',
      buttonLabel: 'Generar mi CV',
      onClick: () => setShowCvBuilder(true),
    }
  }

  const pendingFollowUps = crmItems.filter(
    (i) => i.status === 'seguimiento' && (Date.now() - i.createdAt) / (1000 * 60 * 60 * 24) >= 7
  ).length
  if (pendingFollowUps > 0) {
    return {
      icon: Clock,
      title: pendingFollowUps === 1 ? 'Tienes 1 seguimiento pendiente' : `Tienes ${pendingFollowUps} seguimientos pendientes`,
      desc: 'Estas empresas no han respondido. Escríbeles para reconfirmar tu interés antes de que se cierre el plazo.',
      buttonLabel: 'Ir a Mi CRM',
      onClick: () => setActiveTab('crm'),
    }
  }

  if (crmItems.length === 0) {
    return {
      icon: Search,
      title: 'Aún no guardaste ninguna oferta',
      desc: 'Explora las vacantes disponibles y guarda las que más encajen con tu perfil para empezar tu seguimiento.',
      buttonLabel: 'Ver Ofertas',
      onClick: () => setActiveTab('jobs'),
    }
  }

  const beyondSaved = crmItems.filter((i) => i.status !== 'guardadas').length
  if (beyondSaved === 0) {
    return {
      icon: Send,
      title: crmItems.length === 1 ? 'Tienes 1 oferta guardada esperando' : `Tienes ${crmItems.length} ofertas guardadas esperando`,
      desc: 'Guardarlas es el primer paso. Ahora postula escribiéndole a la empresa para que el proceso avance.',
      buttonLabel: 'Ir a Mi CRM',
      onClick: () => setActiveTab('crm'),
    }
  }

  if (applicationsThisWeek < weeklyTarget) {
    return {
      icon: TrendingUp,
      title: `Te faltan ${weeklyTarget - applicationsThisWeek} postulaciones para tu meta semanal`,
      desc: `Llevas ${applicationsThisWeek} de ${weeklyTarget} esta semana. Más postulaciones activas significan más oportunidades de respuesta.`,
      buttonLabel: 'Ver Ofertas',
      onClick: () => setActiveTab('jobs'),
    }
  }

  return {
    icon: CheckCircle2,
    title: '¡Vas al día con tu búsqueda!',
    desc: 'Cumpliste tu meta semanal y no tienes seguimientos pendientes. Sigue explorando para no perder ritmo.',
    buttonLabel: 'Ver más Ofertas',
    onClick: () => setActiveTab('jobs'),
  }
}

const nextAction = getNextAction()
// Para la etiqueta "temporada actual" del filtro de Ofertas (ver nota junto a selectedSeason)
const isSummerNow = (() => { const m = new Date().getMonth(); return !(m >= 3 && m <= 8) })()

return (
  <div className="min-h-screen bg-[#F4F6F8] text-slate-900 font-sans">

    {/* HEADER Y NAVEGACIÓN */}
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B4079] text-white flex items-center justify-center font-black text-lg shadow-sm">
              J
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-lg leading-tight">Juan Te Avisa</span>
                <span className="font-black text-[#b8860b] text-lg leading-tight">PRO</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none">Sistema Operativo H2B</p>
            </div>
          </div>

          {/* BOTÓN Y ESTADO DE SESIÓN (EL PORTERO) */}
          <UserMenu onEditProfile={() => setShowOnboarding(true)} />
        </div>
        <nav className="flex items-center gap-1 text-xs sm:text-sm font-medium overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
          >
            <Briefcase className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'jobs' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Ofertas ({catalogTotals.jobs})
          </button>
          <button
            onClick={() => setActiveTab('employers')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'employers' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
          >
            <Building2 className="w-4 h-4 text-sky-600" />
            Empresas USCIS ({catalogTotals.employers})
          </button>
          <button
            onClick={() => setActiveTab('agencies')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'agencies' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Agencias DOL ({catalogTotals.agencies})
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'crm' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
          >
            <Send className="w-4 h-4" />
            Mi CRM
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'ai' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Asistentes IA
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'checklist' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Checklist
          </button>
        </nav>
      </div>
    </header>

    {/* CONTENIDO PRINCIPAL */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#091E3A] via-[#0F2B48] to-[#1A365D] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-md">
            <span className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3">
              📣 Ofertas oficiales del DOL, actualizadas a diario
            </span>
            <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">
              ¡Bienvenido a tu Centro de Control H2B!
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl mb-6 leading-relaxed">
              Encuentra ofertas H-2B oficiales, empresas con visas aprobadas por USCIS y agencias reguladas, y lleva el seguimiento de cada postulación.
            </p>
            {/* BARRA DE PROGRESO — BÚSCALAS / POSTULA / VIAJA */}
            <div className="flex items-center gap-0 mb-6 max-w-md">
              {(() => {
                const hasApplied = crmItems.some(i => i.status !== 'guardadas')
                const hasAccepted = crmItems.some(i => i.status === 'aceptado')
                const currentStep = hasAccepted ? 3 : hasApplied ? 2 : 1
                const steps = [
                  { n: 1, label: 'Búscalas' },
                  { n: 2, label: 'Postula' },
                  { n: 3, label: 'Viaja' },
                ]
                return steps.map((s, idx) => (
                  <div key={s.n} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${s.n <= currentStep ? 'bg-[#f5c518] text-[#0B2545]' : 'bg-white/15 text-white/50'
                          }`}
                      >
                        {s.n}
                      </div>
                      <span className={`text-[11px] font-semibold ${s.n <= currentStep ? 'text-white' : 'text-white/50'}`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-5 ${s.n < currentStep ? 'bg-[#f5c518]' : 'bg-white/15'}`} />
                    )}
                  </div>
                ))
              })()}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('jobs')}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
              >
                <Search className="w-4 h-4" /> Explora las Vacantes
              </button>
            </div>
          </div>

          {/* TU PRIORIDAD — la única acción que más importa ahora mismo */}
          {nextAction && (
            <div className="bg-white border-2 border-[#f5c518]/60 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <nextAction.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">🎯 Tu prioridad</span>
                <h2 className="text-base font-black text-slate-900 mt-0.5">{nextAction.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{nextAction.desc}</p>
              </div>
              <button
                onClick={nextAction.onClick}
                className="bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shrink-0 whitespace-nowrap"
              >
                {nextAction.buttonLabel}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OFERTA DE EMPLEO (DOL)</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{catalogTotals.jobs}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Ofertas publicadas
                </p>
              </div>
              <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">EMPRESAS USCIS</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{catalogTotals.employers}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● En el catálogo</p>
              </div>
              <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AGENCIAS REGULADAS</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{catalogTotals.agencies}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● En el catálogo</p>
              </div>
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PROGRESO CHECKLIST</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{checklistPercentage}%</p>
                <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                  {checklistDone > 0 ? `${checklistDone} de ${CHECKLIST_TOTAL_TASKS} completados` : 'Sin iniciar'}
                </p>
              </div>
              <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Extraer Oferta con IA
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Pega un enlace de seasonaljobs.dol.gov para importar la vacante a tu CRM.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={extractUrl}
                onChange={(e) => setExtractUrl(e.target.value)}
                placeholder="https://seasonaljobs.dol.gov/job-order/..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleExtract}
                disabled={isProcessing}
                className="bg-[#0B1528] hover:bg-[#11223f] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {isProcessing ? 'Procesando...' : 'Procesar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA 1: OFERTAS LABORALES (jobs) */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Ofertas Laborales Activas</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Mostrando 21 ofertas por página de <strong className="text-slate-900">{totalJobsCount} vacantes con estos filtros</strong>.
                </p>
              </div>
            </div>

            {sponsorFilter && (
              <div className="flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2">
                <span className="text-xs text-blue-900">
                  Mostrando solo vacantes de <strong>{sponsorFilter.name}</strong>
                </span>
                <button
                  onClick={() => { setSponsorFilter(null); setJobPage(1) }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 shrink-0"
                >
                  Quitar ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por puesto, empresa, ciudad..."
                  value={jobSearch}
                  onChange={(e) => {
                    setJobSearch(e.target.value)
                    setSponsorFilter(null)
                    setJobPage(1)
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
              </div>
              <select
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(e.target.value)
                  setJobPage(1)
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="ALL">Todas las Fechas de Inicio</option>
                <option value="SUMMER">☀️ Verano (Abril a Septiembre){isSummerNow ? ' — temporada actual' : ''}</option>
                <option value="WINTER">❄️ Invierno (Octubre a Marzo){!isSummerNow ? ' — temporada actual' : ''}</option>
              </select>

              {/* SELECTOR COMPLETO DE ESTADOS PARA OFERTAS */}
              <select
                value={selectedJobState}
                onChange={(e) => {
                  setSelectedJobState(e.target.value)
                  setJobPage(1)
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="ALL">Todos los Estados (EE. UU.)</option>
                {US_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
              <select
                value={selectedJobSector}
                onChange={(e) => {
                  setSelectedJobSector(e.target.value)
                  setJobPage(1)
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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

            <label className="flex items-start gap-2.5 cursor-pointer bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2.5">
              <input
                type="checkbox"
                checked={onlyHiresAbroad}
                onChange={(e) => {
                  setOnlyHiresAbroad(e.target.checked)
                  setJobPage(1)
                }}
                className="mt-0.5 w-4 h-4 accent-[#0B4079]"
              />
              <span className="text-xs text-sky-900">
                <strong>🌎 Solo empresas que contratan desde el extranjero</strong>
                <span className="block text-[11px] text-sky-800/80">
                  Empresas que en 2026 trajeron trabajadores con visa tramitada en un consulado fuera de EE. UU.
                </span>
              </span>
            </label>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 shrink-0">Ordenar por:</label>
              <select
                value={jobSortBy}
                onChange={(e) => setJobSortBy(e.target.value as 'recent' | 'match')}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="recent">Más recientes</option>
                <option value="match">Mejor compatible con tu perfil</option>
              </select>
              {jobSortBy === 'match' && !profileCompleted && (
                <span className="text-[11px] text-amber-700">Completa tu perfil para ver esto ordenado de verdad.</span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-xs text-slate-500 font-medium">Cargando ofertas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredJobs.map((job, idx) => (
                <div
                  key={job.id || job.job_order_id || idx}
                  onClick={() => setSelectedJob(job)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
  <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
    {job.case_number || job.job_order_id || `ID: ${job.id || idx + 1}`}
  </span>
  <div className="flex gap-1.5 flex-wrap justify-end">
    {(() => {
      const match = job.id != null ? matchScores[String(job.id)] : undefined
      if (!match) return null
      return (
        <InfoTooltip text="Qué tanto encaja esta oferta con tu perfil (industria, experiencia e inglés). No es la probabilidad de que te den la visa.">
          <span
            className={`font-bold text-[10px] px-2 py-0.5 rounded border ${
              match.score >= 80
                ? 'bg-red-50 text-red-700 border-red-200'
                : match.score >= 50
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            {match.score >= 80 ? '🔥' : match.score >= 50 ? '🟡' : '⚪'} {match.score}% compatible
          </span>
        </InfoTooltip>
      )
    })()}
    {(() => {
      const source = sourceInfo(job.source)
      return (
        <InfoTooltip text={source.tooltip}>
          <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-200">
            ✓ Verificada · {source.label}
          </span>
        </InfoTooltip>
      )
    })()}
  </div>
</div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{job.title || 'Oferta de Trabajo'}</h3>
                      <p className="text-xs font-bold text-blue-700 mt-0.5">{job.employer_name || 'Empleador Registrado'}</p>
                      <div className="mt-2">
                        <SponsorHistory sponsor={job.sponsor} match={job.sponsor_match} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>Ubicación:</strong> {job.location || `${job.city || ''} ${job.state || ''}` || 'EE.UU.'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>Salario:</strong> {job.wage || 'Según Contrato'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>Inicio:</strong> {job.begin_date || 'A convenir'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>Vacantes:</strong> {job.workers_requested || 'Disponibles'}</span>
                      </div>
                    </div>
                  </div>
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
      )}

      {/* TABLA 2: EMPRESAS USCIS (employers) */}
      {activeTab === 'employers' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Empresas Patrocinadoras (USCIS)</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Historial real de USCIS: <strong className="text-slate-900">{totalEmployersCount} empresas con estos filtros</strong> ya
                  tuvieron visas H-2B aprobadas. Si tienen una vacante publicada ahora, te llevamos directo a ella.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => {
                    setCompanySearch(e.target.value)
                    setCompanyPage(1)
                  }}
                  placeholder="Buscar por nombre o ciudad..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <select
                value={selectedCapType}
                onChange={(e) => {
                  setSelectedCapType(e.target.value)
                  setCompanyPage(1)
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                <option value="ALL">Todas las Temporadas / Cap Type</option>
                <option value="1st Half">❄️ Invierno (1st Half)</option>
                <option value="2nd Half">☀️ Verano (2nd Half)</option>
                <option value="Exempt">🛡️ Exempt (Exentas)</option>
                <option value="Supplement">⚡ Supplement (Suplementarias)</option>
              </select>
              {/* SELECTOR COMPLETO DE ESTADOS PARA EMPRESAS */}
              <select
                value={selectedCompanyState}
                onChange={(e) => {
                  setSelectedCompanyState(e.target.value)
                  setCompanyPage(1)
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                <option value="ALL">Todos los Estados (EE. UU.)</option>
                {US_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
              <select
                value={selectedCompanySector}
                onChange={(e) => {
                  setSelectedCompanySector(e.target.value)
                  setCompanyPage(1)
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
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
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-xs text-slate-500 font-medium">Cargando empresas...</p>
            </div>
          ) : (
            <>
              {/* CELULAR: tarjetas apiladas — una tabla de 6 columnas no cabe en 390px */}
              <div className="md:hidden space-y-3">
                {employers.map((comp, idx) => {
                  const abroad = String(comp.consular_processed || '').toLowerCase() === 'yes'
                  return (
                    <div key={comp.id || idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{comp.employer_name || 'Sin Nombre'}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] border ${comp.cap_type?.includes('1st Half') ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            comp.cap_type?.includes('2nd Half') ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              comp.cap_type?.includes('Exempt') ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                          {comp.cap_type || 'General'}
                        </span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] border ${abroad ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {abroad ? '🌎 Contrata desde el extranjero' : 'Solo contrató dentro de EE. UU.'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{comp.worksite_states || comp.state || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
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
                        <p className="text-[11px] text-slate-400 italic text-center py-1.5">Sin vacantes publicadas ahora</p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* ESCRITORIO: tabla completa */}
              <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4">Empresa Patrocinadora</th>
                        <th className="p-4">Tipo de Cupo (Cap)</th>
                        <th className="p-4">Ubicación</th>
                        <th className="p-4">Consular Processed</th>
                        <th className="p-4">Visas Aprobadas</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {employers.map((comp, idx) => (
                        <tr key={comp.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-slate-900">{comp.employer_name || 'Sin Nombre'}</td>
                          <td className="p-4">
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${comp.cap_type?.includes('1st Half') ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                comp.cap_type?.includes('2nd Half') ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                                  comp.cap_type?.includes('Exempt') ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                                    'bg-emerald-50 text-emerald-800 border border-emerald-200'
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
                              <span className="text-[11px] text-slate-400 italic">Sin vacantes ahora</span>
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
      )}

      {/* TABLA 3: AGENCIAS DOL (sponsor_agencies) */}
      {activeTab === 'agencies' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Verifica un Reclutador</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Lista oficial del DOL de agencias y reclutadores declarados para H-2B —{' '}
                  <strong className="text-slate-900">{totalAgenciesCount} con estos filtros</strong>. Úsala para revisar si
                  quien te contactó está en la lista oficial antes de dar tus datos.
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs text-amber-900">
              ⚠️ ¿Te contactó alguien pidiendo dinero o tus documentos? Aunque aparezca aquí, revísalo con el{' '}
              <strong>Detector de Estafas</strong> en Asistentes IA antes de responder.
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                value={agencySearch}
                onChange={(e) => {
                  setAgencySearch(e.target.value)
                  setAgencyPage(1)
                }}
                placeholder="Buscar agencia por nombre o ciudad..."
                className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={selectedAgencyCountry}
                onChange={(e) => {
                  setSelectedAgencyCountry(e.target.value)
                  setAgencyPage(1)
                }}
                className="w-full sm:w-56 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-xs text-slate-500 font-medium">Cargando agencias...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {agencies.map((agency, idx) => {
                const webLink = agency.website
                const location = [agency.city, agency.country].filter(Boolean).join(', ')
                return (
                  <div key={agency.id || idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                    <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-200 inline-block">
                      ✓ En la lista oficial del DOL
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{agency.agency_name}</h3>
                    {location && (
                      <p className="text-xs text-slate-500">📍 <strong className="text-slate-800">{location}</strong></p>
                    )}

                    {webLink ? (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <span>🌐</span>
                        <a
                          href={webLink.startsWith('http') ? webLink : `https://${webLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium truncate max-w-[180px]"
                          title={webLink}
                        >
                          {webLink.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic mt-1">
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
      )}

      {/* MI CRM — CENTRO DE COMANDO KANBAN */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Centro de Comando de Postulaciones</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Gestiona tus postulaciones, seguimiento de 7-14-21 días, entrevistas y estados finales de forma visual.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="relative z-10 cursor-pointer bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                Agregar Postulación Manual
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">Salud de tu búsqueda semanal:</span>
                  <span className="bg-blue-100 text-blue-700 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                    {applicationsThisWeek} de {weeklyTarget} aplicadas
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Mantén el ritmo de postulaciones recomendado para maximizar tus resultados H2B.</p>
              </div>
              <div className="w-full sm:w-48 bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${searchHealthPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {crmError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando tus postulaciones...
            </div>
          )}

          <div className={`${crmError || crmLoading ? "hidden" : "grid"} grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-start overflow-x-auto pb-4`}>
            {/* COLUMNA 1: GUARDADAS */}
            <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 md:min-h-[500px] flex flex-col space-y-3">
              <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200">
                <span className="font-extrabold text-[11px] text-slate-500 tracking-wider">GUARDADAS</span>
                <span className="bg-white text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                  {crmItems.filter(i => i.status === 'guardadas').length}
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {crmItems.filter(i => i.status === 'guardadas').map(item => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3 relative group">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-900 text-xs leading-tight">{item.company}</h3>
                        <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{item.role}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-[11px]">
                      {editingNotesId === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            placeholder="Nota rápida..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] focus:outline-none"
                            rows={2}
                          />
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setEditingNotesId(null)} className="px-1 text-[9px] text-slate-500">Cancelar</button>
                            <button onClick={() => saveNotes(item.id)} className="bg-blue-600 text-white px-2 py-0.5 text-[9px] rounded font-bold">Guardar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-600 italic truncate max-w-[100px]">
                            {item.notes ? `📝 ${item.notes}` : 'Sin notas'}
                          </span>
                          <button onClick={() => { setEditingNotesId(item.id); setTempNotes(item.notes || ''); }} className="text-blue-600 font-bold text-[9px]">
                            {item.notes ? 'Editar' : '+ Nota'}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[9px] text-slate-400">{item.dateLabel}</span>
                      <button onClick={() => changeCrmStatus(item.id, 'postulado')} className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg">
                        Postular <MoveRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {crmItems.filter(i => i.status === 'guardadas').length === 0 && (
                  <p className="text-[11px] text-slate-400 italic p-3 text-center leading-relaxed">
                    Guarda una oferta desde la pestaña Ofertas para empezar tu seguimiento.
                  </p>
                )}
              </div>
            </div>

            {/* COLUMNA 2: POSTULADO */}
            <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 md:min-h-[500px] flex flex-col space-y-3">
              <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200">
                <span className="font-extrabold text-[11px] text-sky-500 tracking-wider">POSTULADO</span>
                <span className="bg-white text-sky-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                  {crmItems.filter(i => i.status === 'postulado').length}
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {crmItems.filter(i => i.status === 'postulado').map(item => (
                  <div key={item.id} className="bg-white border border-sky-200 rounded-xl p-3.5 shadow-2xs space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-900 text-xs leading-tight">{item.company}</h3>
                        <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{item.role}</p>
                    </div>
                    <div className="bg-sky-50 border border-sky-200 text-sky-800 text-[9px] font-semibold px-2 py-1 rounded-lg">
                      ✅ Marcaste que ya postulaste
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-[11px]">
                      {editingNotesId === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px]"
                            rows={2}
                          />
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setEditingNotesId(null)} className="px-1 text-[9px]">Cancelar</button>
                            <button onClick={() => saveNotes(item.id)} className="bg-blue-600 text-white px-2 py-0.5 text-[9px] rounded font-bold">Guardar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-600 italic truncate max-w-[100px]">
                            {item.notes ? `📝 ${item.notes}` : 'Sin notas'}
                          </span>
                          <button onClick={() => { setEditingNotesId(item.id); setTempNotes(item.notes || ''); }} className="text-blue-600 font-bold text-[9px]">
                            {item.notes ? 'Editar' : '+ Nota'}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center gap-1">
                      <button
                        onClick={() => openEmailFor(item)}
                        title="Redactar correo con tu CV"
                        className="text-[10px] font-bold text-slate-600 flex items-center gap-0.5 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg"
                      >
                        ✉️
                      </button>
                      <button onClick={() => changeCrmStatus(item.id, 'seguimiento')} className="text-[10px] font-bold text-sky-700 flex items-center gap-0.5 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-lg">
                        Seguimiento <MoveRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {crmItems.filter(i => i.status === 'postulado').length === 0 && (
                  <p className="text-[11px] text-slate-400 italic p-3 text-center leading-relaxed">
                    Cuando postules a una oferta guardada, aparecerá aquí.
                  </p>
                )}
              </div>
            </div>

            {/* COLUMNA 3: SEGUIMIENTO (7-14-21 DÍAS) */}
            <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 md:min-h-[500px] flex flex-col space-y-3">
              <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200">
                <span className="font-extrabold text-[11px] text-sky-500 tracking-wider">SEGUIMIENTO</span>
                <span className="bg-white text-sky-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                  {crmItems.filter(i => i.status === 'seguimiento').length}
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {crmItems.filter(i => i.status === 'seguimiento').map(item => {
                  const daysPassed = Math.floor((Date.now() - item.createdAt) / (1000 * 60 * 60 * 24))
                  let trackingMessage = 'En seguimiento activo'
                  let badgeColor = 'bg-amber-50 border-amber-200 text-amber-800'
                  if (daysPassed >= 14) {
                    trackingMessage = '📧 Envía tu segundo correo de seguimiento'
                    badgeColor = 'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                  } else if (daysPassed >= 7) {
                    trackingMessage = '✉️ Envía tu primer correo de seguimiento'
                    badgeColor = 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                  }
                  return (
                    <div key={item.id} className="bg-white border border-sky-200 rounded-xl p-3.5 shadow-2xs space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs leading-tight">{item.company}</h3>
                          <p className="text-[11px] text-slate-500 font-medium">{item.role}</p>
                        </div>
                        <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                      <div className={`${badgeColor} border text-[9px] font-semibold px-2 py-1 rounded-lg text-center`}>{trackingMessage}</div>
                      <div className="pt-2 border-t border-slate-100 text-[11px]">
                        {editingNotesId === item.id ? (
                          <div className="space-y-2">
                            <textarea value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px]" rows={2} />
                            <div className="flex gap-1 justify-end"><button onClick={() => setEditingNotesId(null)} className="px-1 text-[9px]">Cancelar</button><button onClick={() => saveNotes(item.id)} className="bg-blue-600 text-white px-2 py-0.5 text-[9px] rounded font-bold">Guardar</button></div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center"><span className="text-[10px] text-slate-600 italic truncate max-w-[100px]">{item.notes ? `📝 ${item.notes}` : 'Sin notas'}</span><button onClick={() => { setEditingNotesId(item.id); setTempNotes(item.notes || '') }} className="text-blue-600 font-bold text-[9px]">{item.notes ? 'Editar' : '+ Nota'}</button></div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center gap-1">
                        <button onClick={() => openEmailFor(item)} title="Redactar correo con tu CV" className="text-[10px] font-bold text-slate-600 flex items-center gap-0.5 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg">✉️</button>
                        <span className="text-[9px] text-slate-400">Día {daysPassed}</span>
                        <button onClick={() => changeCrmStatus(item.id, 'entrevista')} className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg">Entrevista <MoveRight className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )
                })}
                {crmItems.filter(i => i.status === 'seguimiento').length === 0 && (
                  <p className="text-[11px] text-slate-400 italic p-3 text-center leading-relaxed">
                    A los 7 días de postular, la tarjeta pasa aquí sola y te avisamos por correo para que escribas a la empresa.
                  </p>
                )}
              </div>
            </div>

            {/* COLUMNA 4: ENTREVISTA */}
            <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 md:min-h-[500px] flex flex-col space-y-3">
              <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200">
                <span className="font-extrabold text-[11px] text-indigo-500 tracking-wider">ENTREVISTA</span>
                <span className="bg-white text-indigo-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                  {crmItems.filter(i => i.status === 'entrevista').length}
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {crmItems.filter(i => i.status === 'entrevista').map(item => (
                  <div key={item.id} className="bg-white border border-indigo-200 rounded-xl p-3.5 shadow-2xs space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-900 text-xs leading-tight">{item.company}</h3>
                        <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{item.role}</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-[9px] font-semibold px-2 py-1 rounded-lg text-center">
                      ⭐ En proceso de entrevista
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-[11px]">
                      {editingNotesId === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px]"
                            rows={2}
                          />
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setEditingNotesId(null)} className="px-1 text-[9px]">Cancelar</button>
                            <button onClick={() => saveNotes(item.id)} className="bg-blue-600 text-white px-2 py-0.5 text-[9px] rounded font-bold">Guardar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-600 italic truncate max-w-[100px]">
                            {item.notes ? `📝 ${item.notes}` : 'Sin notas'}
                          </span>
                          <button onClick={() => { setEditingNotesId(item.id); setTempNotes(item.notes || ''); }} className="text-blue-600 font-bold text-[9px]">
                            {item.notes ? 'Editar' : '+ Nota'}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => changeCrmStatus(item.id, 'aceptado')}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] py-1.5 px-2 rounded-lg border border-emerald-200 flex items-center justify-center gap-1 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Aceptado
                      </button>
                      <button
                        onClick={() => changeCrmStatus(item.id, 'rechazada')}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[10px] py-1.5 px-2 rounded-lg border border-rose-200 flex items-center justify-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3 h-3 text-rose-600" /> Rechazado
                      </button>
                    </div>
                  </div>
                ))}
                {crmItems.filter(i => i.status === 'entrevista').length === 0 && (
                  <p className="text-[11px] text-slate-400 italic p-3 text-center leading-relaxed">
                    Aquí verás las postulaciones en las que te llamaron a entrevista.
                  </p>
                )}
              </div>
            </div>

            {/* COLUMNA 5: ACEPTADO */}
            <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 md:min-h-[500px] flex flex-col space-y-3">
              <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200">
                <span className="font-extrabold text-[11px] text-emerald-800 tracking-wider">ACEPTADO</span>
                <span className="bg-white text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                  {crmItems.filter(i => i.status === 'aceptado').length}
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {crmItems.filter(i => i.status === 'aceptado').map(item => (
                  <div key={item.id} className="bg-white border border-emerald-300 rounded-xl p-3.5 shadow-2xs space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900 text-xs">{item.company}</h3>
                      <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.role}</p>
                    <div className="bg-emerald-50 text-emerald-800 text-[9px] font-bold p-1.5 rounded-lg text-center">
                      🎉 ¡Proceso USCIS iniciado!
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <span className="text-[9px] text-slate-400">{item.dateLabel}</span>
                    </div>
                  </div>
                ))}
                {crmItems.filter(i => i.status === 'aceptado').length === 0 && (
                  <p className="text-[11px] text-slate-400 italic p-3 text-center leading-relaxed">
                    Aquí verás las ofertas que aceptaste.
                  </p>
                )}
              </div>
            </div>

            {/* COLUMNA 6: NO RESPONDIDO / RECHAZADA */}
            <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 md:min-h-[500px] flex flex-col space-y-3">
              <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200">
                <span className="font-extrabold text-[11px] text-rose-800 tracking-wider">NO RESPONDIDO / RECHAZADO</span>
                <span className="bg-white text-rose-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                  {crmItems.filter(i => i.status === 'no_respondido' || i.status === 'rechazada').length}
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {crmItems.filter(i => i.status === 'no_respondido' || i.status === 'rechazada').map(item => (
                  <div key={item.id} className="bg-white border border-rose-200 rounded-xl p-3.5 shadow-2xs space-y-2 opacity-80">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900 text-xs">{item.company}</h3>
                      <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.role}</p>
                    <div className="bg-rose-50 text-rose-800 text-[9px] font-bold p-1.5 rounded-lg text-center">
                      {item.status === 'no_respondido' ? '⌛ Expirado (21 días sin respuesta)' : '❌ Postulación rechazada'}
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[9px] text-slate-400">{item.dateLabel}</span>
                      <button
                        onClick={() => changeCrmStatus(item.id, 'entrevista')}
                        className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg"
                      >
                        Me respondieron
                      </button>
                    </div>
                  </div>
                ))}
                {crmItems.filter(i => i.status === 'no_respondido' || i.status === 'rechazada').length === 0 && (
                  <p className="text-[11px] text-slate-400 italic p-3 text-center leading-relaxed">
                    Si una empresa no responde en 21 días, la tarjeta pasa aquí. Si luego te responden, puedes reactivarla.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ASISTENTES IA */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
            <h1 className="text-2xl font-black text-slate-900">Asistentes Virtuales IA</h1>
            <p className="text-xs text-slate-500">Herramientas inteligentes para acelerar tu proceso de postulación laboral H2B.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Adaptador de CV H2B</h3>
                  <p className="text-xs text-slate-500">
                    {hasCv
                      ? 'Tu CV ya está listo y alimenta el redactor de correos.'
                      : 'Cuéntanos tu experiencia real y la IA la adapta al formato que esperan los empleadores.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCvBuilder(true)}
                className="w-full bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                {hasCv ? 'Editar mi CV' : 'Generar mi CV con IA'}
              </button>
            </div>

            {/* Tarjeta 3: Asistente de Correo IA */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4 mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Redactor de Correos H2B</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Crea emails de postulación y seguimiento profesionales para enviar por Gmail u Outlook.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailAssistant(v => !v)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                {showEmailAssistant ? 'Cerrar Redactor' : 'Abrir Redactor'}
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Simulador de Entrevista</h3>
                  <p className="text-xs text-slate-500">Práctica preguntas habituales de los patrocinadores laborales.</p>
                </div>
              </div>
              <button disabled className="w-full bg-slate-100 text-slate-500 font-bold text-xs py-2.5 rounded-xl cursor-not-allowed">
                Próximamente
              </button>
            </div>
          </div>

          {showEmailAssistant && (
            <EmailAssistantTab
              key={`${emailDraftFor?.company || ''}-${emailDraftFor?.role || ''}`}
              userId={onboardingUserId}
              initialCompanyName={emailDraftFor?.company || ''}
              initialJobTitle={emailDraftFor?.role || ''}
              savedOffers={crmItems.map(i => ({ company: i.company, role: i.role, state: i.state }))}
              onOpenCvBuilder={() => setShowCvBuilder(true)}
            />
          )}
        </div>
      )}

     {/* TAB CHECKLIST EN app/page.tsx */}
{activeTab === 'checklist' && (
  <RoadmapChecklist
  hasCompletedQuiz={profileCompleted}
  hasCv={hasCv}
  onEditProfile={() => setShowOnboarding(true)}
  onOpenCvBuilder={() => setShowCvBuilder(true)}
  userId={onboardingUserId}
  onNavigateToTab={(tab) => {
    if ((TABS as string[]).includes(tab)) setActiveTab(tab as Tab)
  }}
/>
)}
      {/* MODAL DETALLE DE OFERTA LABORAL (ÚNICO) */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          {/* Shell fijo max-h-[90vh]: el botón cerrar queda afuera del scroll interno,
              así nunca se va con el contenido en pantallas de celular */}
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl relative overflow-hidden">

            {/* BOTÓN CERRAR */}
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-h-[90vh] overflow-y-auto p-6 space-y-4">

            {/* ENCABEZADO CON ID, TITULO Y FECHAS A LA DERECHA */}
            <div className="flex justify-between items-start gap-4 pr-6">
              <div className="space-y-1">
                <span className="bg-slate-100 text-slate-700 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded">
                  Job Order ID: {selectedJob.case_number || selectedJob.job_order_id || selectedJob.id}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">{selectedJob.title || selectedJob.job_title}</h2>
                <p className="text-xs font-bold text-blue-700">{selectedJob.employer_name || selectedJob.emp_name}</p>
              </div>

              <div className="text-right text-[11px] shrink-0 pt-1 leading-tight">
                <p className="text-slate-600 font-medium">
                  <strong>Begin date:</strong> {selectedJob.begin_date || selectedJob.start_date || selectedJob.fecha_inicio || "N/A"}
                </p>
                <p className="text-slate-600 font-medium mt-0.5">
                  <strong>End date:</strong> {selectedJob.end_date || selectedJob.fecha_fin || "N/A"}
                </p>
              </div>
            </div>

            {/* GRILLA RESUMEN */}
            <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100/80">
              <div>
                <span className="text-slate-400 block font-medium text-[11px]">Ubicación:</span>
                <strong className="text-slate-800 font-bold">{selectedJob.location || `${selectedJob.city || ''}, ${selectedJob.state || ''}`.trim() || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium text-[11px]">Salario:</span>
                <strong className="text-slate-800 font-bold">{selectedJob.wage || selectedJob.pay_rate || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium text-[11px]">Vacantes:</span>
                <strong className="text-slate-800 font-bold">{selectedJob.workers_requested || selectedJob.workers_needed || selectedJob.vacantes || 'N/A'}</strong>
              </div>
            </div>

            {/* HISTORIAL DE LA EMPRESA EN USCIS */}
            <SponsorHistory sponsor={selectedJob.sponsor} match={selectedJob.sponsor_match} variant="full" />

            {/* RECRUITMENT INFORMATION */}
            <div className="space-y-1 border-t border-slate-100 pt-3 text-left">
              <h3 className="font-bold text-blue-900 text-xs">Recruitment Information</h3>
              <p className="text-[11px] text-slate-700">
                <strong>Telephone Number to Apply:</strong> {selectedJob.phone_to_apply || selectedJob.phone || selectedJob.recruitment_phone || "N/A"}
              </p>
              <p className="text-[11px] text-slate-700">
                <strong>Email address to Apply:</strong>{" "}
                {(selectedJob.email || selectedJob.recruitment_email || selectedJob.email_to_apply || selectedJob.emp_email) ? (
                  <a
                    href={`mailto:${selectedJob.email || selectedJob.recruitment_email || selectedJob.email_to_apply || selectedJob.emp_email}`}
                    className="text-blue-600 underline font-medium"
                  >
                    {selectedJob.email || selectedJob.recruitment_email || selectedJob.email_to_apply || selectedJob.emp_email}
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
            </div>

            {/* JOB DESCRIPTION */}
            <div className="space-y-1 border-t border-slate-100 pt-3 text-left">
              <h3 className="font-bold text-blue-900 text-xs">Job Description</h3>
              <p className="text-[11px] text-slate-700">
                <strong>Full Time:</strong> {(selectedJob.full_time !== undefined ? (selectedJob.full_time ? "Yes" : "No") : (selectedJob.jornada === 'Tiempo Completo' ? "Yes" : "No"))}
              </p>
              <p className="text-[11px] text-slate-700">
                <strong>Number of Workers Requested:</strong> {selectedJob.workers_requested || selectedJob.workers_needed || selectedJob.vacantes || "N/A"}
              </p>

              <div className="text-[11px] text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100 mt-2">
                <strong>Job Duties:</strong>
                {/* 
                     - Se removió 'max-h-28' y se cambió a 'max-h-48'
                     - 'overflow-y-auto' muestra scroll SOLO si sobrepasa la altura
                  */}
                <p className="mt-0.5 max-h-48 overflow-y-auto pr-1 whitespace-pre-line text-slate-600 scrollbar-thin">
                  {selectedJob.job_description || selectedJob.job_duties || selectedJob.description || selectedJob.duties || "Sin descripción disponible."}
                </p>
              </div>
            </div>

            {/* BOTÓN POSTULAR */}
            <div className="pt-1">
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
                  <button
                    onClick={() => setApplyFlowJob({
                      title: selectedJob.title || selectedJob.job_title || 'Vacante H2B',
                      employerName: selectedJob.employer_name || selectedJob.emp_name || 'Empresa Generica',
                      location: selectedJob.location || `${selectedJob.city || ''}, ${selectedJob.state || ''}`.trim(),
                      contactEmail: selectedJob.email_to_apply || selectedJob.email || selectedJob.recruitment_email || selectedJob.emp_email || '',
                    })}
                    className="w-full bg-[#00A86B] hover:bg-[#008f5b] text-white font-bold text-xs py-3 rounded-xl transition-all text-center flex items-center justify-center gap-2 shadow-sm"
                  >
                    ✉️ Postular ahora
                  </button>
                )
              })()}
            </div>
            </div>
          </div>
        </div>
      )}
    </main>
    {/* MODAL DE POSTULACIÓN MANUAL */}
    {isManualModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in duration-200">

          <div className="sticky top-0 z-10 bg-white flex justify-between items-center px-6 pt-6 pb-2 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Agregar Postulación Manual</h3>
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 text-base font-bold"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveManualItem} className="space-y-4 px-6 pb-6 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa *</label>
              <input
                type="text"
                required
                placeholder="Ej: Agro S.A."
                value={manualCompany}
                onChange={(e) => setManualCompany(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Puesto / Vacante</label>
              <input
                type="text"
                placeholder="Ej: Operador Agrícola H2B"
                value={manualRole}
                onChange={(e) => setManualRole(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Estado / Ubicación</label>
              <input
                type="text"
                placeholder="Ej: TX o Texas"
                value={manualState}
                onChange={(e) => setManualState(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Estado de la Postulación</label>
              <select
                value={manualStatus}
                onChange={(e) => setManualStatus(e.target.value as CRMItem['status'])}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="guardadas">Guardadas</option>
                <option value="postulado">Postulado</option>
                <option value="seguimiento">Seguimiento (7-14-21)</option>
                <option value="entrevista">Entrevista</option>
                <option value="aceptado">Aceptado</option>
                <option value="no_respondido">No respondido / Rechazado</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingManual}
                className="px-4 py-2 text-xs font-semibold bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white rounded-lg shadow transition-colors"
              >
                {isSavingManual ? 'Guardando...' : 'Guardar Postulación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    <OnboardingModal
      isOpen={showOnboarding}
      userId={onboardingUserId}
      onComplete={() => {
        setShowOnboarding(false)
        window.location.reload()
      }}
      onClose={() => setShowOnboarding(false)}
    />

    <CVBuilderModal
      isOpen={showCvBuilder}
      userId={onboardingUserId}
      onClose={() => setShowCvBuilder(false)}
      onSaved={() => refreshHasCv(onboardingUserId)}
    />

    <ApplyFlowModal
      // Oculto mientras el constructor de CV está abierto (no dos modales
      // encimados); al cerrarlo (guardado o no) reaparece solo, continuando
      // la misma postulación en vez de dejar a la persona botada.
      isOpen={!!applyFlowJob && !showCvBuilder}
      userId={onboardingUserId}
      job={applyFlowJob}
      alreadySavedStatus={
        applyFlowJob
          ? crmItems.find(i => crmKey(i.company, i.role) === crmKey(applyFlowJob.employerName, applyFlowJob.title))?.status ?? null
          : null
      }
      onClose={() => setApplyFlowJob(null)}
      onOpenCvBuilder={() => setShowCvBuilder(true)}
      onApplied={() => applyFlowJob && applyJobToCrm(applyFlowJob)}
    />

    {toastMessage && (
      <div
        role="status"
        aria-live="polite"
        className="fixed z-[100] left-4 right-4 sm:left-auto sm:right-6 bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-6 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-center sm:text-left animate-in fade-in slide-in-from-bottom-4"
      >
        {toastMessage}
      </div>
    )}
  </div>
);
}
