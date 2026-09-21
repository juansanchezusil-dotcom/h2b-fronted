'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import OnboardingModal from '@/components/OnboardingModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import UserMenu from '@/components/UserMenu';
import {
  Briefcase,
  Building2,
  ShieldCheck,
  Send,
  CheckCircle2,
  Search,
  Sparkles,
  Link as LinkIcon,
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
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

const supabase = getSupabaseClient()

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
  [key: string]: any
}

interface SponsorAgency {
  id?: string | number
  agency_name?: string
  city?: string
  province?: string
  country?: string
  case_count?: number
  contact_email?: string
  official_website?: string
  website?: string
  status?: string
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
  notes?: string
}

type ProfileLevel = 'experimentado' | 'transicion' | 'sin_experiencia' | null

interface ChecklistItem {
  id: number
  title: string
  desc: string
  completed: boolean
  linkTab?: 'ai' | 'jobs' | 'crm'
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'employers' | 'agencies' | 'crm' | 'ai' | 'checklist'>('dashboard')
  
  // --- ESTADOS DE DATOS REALES ---
  const [jobs, setJobs] = useState<Job[]>([])
  const [totalJobsCount, setTotalJobsCount] = useState<number>(0)
  const [employers, setEmployers] = useState<SponsorCompany[]>([])
  const [totalEmployersCount, setTotalEmployersCount] = useState<number>(0)
  const [agencies, setAgencies] = useState<SponsorAgency[]>([])
  const [totalAgenciesCount, setTotalAgenciesCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingUserId, setOnboardingUserId] = useState<string>('')

  // --- FILTROS DE BÚSQUEDA INDEPENDIENTES ---
  const [jobSearch, setJobSearch] = useState('')
  const [selectedJobState, setSelectedJobState] = useState('ALL')
  const [selectedJobSector, setSelectedJobSector] = useState('ALL')
  const [selectedSeason, setSelectedSeason] = useState('ALL')
  
  const [companySearch, setCompanySearch] = useState('')
  const [selectedCompanyState, setSelectedCompanyState] = useState('ALL')
  const [selectedCompanySector, setSelectedCompanySector] = useState('ALL')
  const [selectedCapType, setSelectedCapType] = useState('ALL')
  
  const [agencySearch, setAgencySearch] = useState('')
  const [selectedAgencyCountry, setSelectedAgencyCountry] = useState('ALL')
  
  // --- PAGINACIÓN ---
  const ITEMS_PER_PAGE = 20
  const [jobPage, setJobPage] = useState(1)
  const [companyPage, setCompanyPage] = useState(1)
  const [agencyPage, setAgencyPage] = useState(1)
  
  // Extractor IA
  const [extractUrl, setExtractUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // ===== CRM =====
  const [crmItems, setCrmItems] = useState<CRMItem[]>([
    { 
      id: '1', 
      company: 'Lone Star Landscaping', 
      role: 'Operador Jardín', 
      state: 'TX', 
      status: 'guardadas', 
      dateLabel: 'Guardado recientemente',
      lastUpdated: Date.now(),
      notes: 'Reclutador principal se llama Sarah.'
    }
  ])
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState<string>('')

  // Modal Postulación Manual
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [manualCompany, setManualCompany] = useState('')
  const [manualRole, setManualRole] = useState('')
  const [manualState, setManualState] = useState('')
  const [manualStatus, setManualStatus] = useState<CRMItem['status']>('guardadas')

  const handleSaveManualItem = (e: React.FormEvent) => {
  e.preventDefault()
  if (!manualCompany.trim()) return

  const newItem: CRMItem = {
    id: Date.now().toString(),
    company: manualCompany.trim(),
    role: manualRole.trim() || 'Vacante H2B',
    state: manualState.trim() || 'US',
    status: manualStatus || 'guardadas',
    dateLabel: 'Guardado recién',
    lastUpdated: Date.now(),
    notes: ''
  }

  setCrmItems(prev => {
    const updated = [newItem, ...prev]
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_items', JSON.stringify(updated))
    }
    return updated
  })

  // Limpiar formulario y cerrar modal
  setManualCompany('')
  setManualRole('')
  setManualState('')
  setManualStatus('guardado' as any)
  setIsManualModalOpen(false)
}
  useEffect(() => {
  async function checkUserProfile() {
    console.log('🔍 Verificando perfil...')

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('👤 Usuario:', user, 'Error de auth:', userError)

    if (user) {
      setOnboardingUserId(user.id)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('perfil_completado')
        .eq('id', user.id)
        .maybeSingle()

      console.log('📋 Perfil encontrado:', profile, 'Error de consulta:', error)

      if (error || !profile || profile.perfil_completado !== true) {
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
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [profileLevel, setProfileLevel] = useState<ProfileLevel>(null)
  const [quizIndustria, setQuizIndustria] = useState<string>('')
  const [quizExperiencia, setQuizExperiencia] = useState<string>('')

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setCrmItems(prevItems => 
        prevItems.map(item => {
          if (item.status === 'seguimiento') {
            const diffDays = (now - item.lastUpdated) / (1000 * 60 * 60 * 24)
            if (diffDays >= 21) {
              return { ...item, status: 'no_respondido', dateLabel: 'Expirado a los 21 días' }
            }
          }
          return item
        })
      )
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const getChecklistForLevel = (level: ProfileLevel): ChecklistItem[] => {
    const base: ChecklistItem[] = [
      {
        id: 1,
        title: 'Revisión y Formato de CV en Inglés',
        desc: level === 'transicion'
          ? 'Adapta y optimiza tu CV para vincular tu experiencia actual con la posición que deseas postular.'
          : 'Asegúrate de estructurar tu CV con el estándar estadounidense.',
        completed: false,
        linkTab: 'ai'
      },
      {
        id: 2,
        title: 'Identificación de Oferta y Empleador DOL',
        desc: 'Verifica la certificación laboral en el portal oficial del DOL.',
        completed: false,
        linkTab: 'jobs'
      },
      {
        id: 3,
        title: 'Envío de Postulación y Contacto Directo',
        desc: 'Escribe al correo oficial de aplicación o reclutador registrado.',
        completed: false,
        linkTab: 'crm'
      },
      {
        id: 4,
        title: 'Entrevista Laboral con el Patrocinador',
        desc: 'Prepárate con el asistente IA para preguntas frecuentes.',
        completed: false,
        linkTab: 'ai'
      },
      { id: 5, title: 'Aprobación de Petición I-129 en USCIS', desc: 'El empleador envía la notificación de aprobación de la petición.', completed: false },
      { id: 6, title: 'Llenado de Formulario DS-160', desc: 'Completa tu solicitud consular de visa de trabajo.', completed: false },
      { id: 7, title: 'Cita Consular y Pago de Tasa MRV', desc: 'Asiste a tu cita en el consulado con la documentación requerida.', completed: false }
    ]

    if (level === 'sin_experiencia') {
      const extraStep: ChecklistItem = {
        id: 0,
        title: 'Suma experiencia antes de postular',
        desc: 'Considera sumar experiencia en hotelería, construcción o jardinería, que son las industrias con mayor demanda para la Visa H2B.',
        completed: false
      }
      return [extraStep, ...base]
    }
    return base
  }

  const submitProfileQuiz = () => {
  let level: ProfileLevel = 'experimentado'
  if (quizExperiencia === '0') {
    level = 'sin_experiencia'
  } else if (quizIndustria !== 'alta') {
    level = 'transicion'
  }
  setProfileLevel(level)
  setChecklist(getChecklistForLevel(level))
}

  const resetProfileQuiz = () => {
    setProfileLevel(null)
    setQuizIndustria('')
    setQuizExperiencia('')
    setChecklist([])
  }

  // CARGA INICIAL DE TOTALES
  useEffect(() => {
    const fetchInitialCounts = async () => {
      const { count: cJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
      if (cJobs !== null) setTotalJobsCount(cJobs)
      
      const { count: cEmployers } = await supabase
        .from('sponsor_companies')
        .select('*', { count: 'exact', head: true })
      if (cEmployers !== null) setTotalEmployersCount(cEmployers)
      
      const { count: cAgencies } = await supabase
        .from('sponsor_agencies')
        .select('*', { count: 'exact', head: true })
      if (cAgencies !== null) setTotalAgenciesCount(cAgencies)
    }
    fetchInitialCounts()
  }, [])

  // CONSULTAS DE OFERTAS LABORALES
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true)
      const from = (jobPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .order('begin_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false, nullsFirst: false });
        
      if (selectedJobState && selectedJobState !== 'ALL') {
        const match = selectedJobState.match(/\(([^)]+)\)/)
        const stateCode = match ? match[1] : selectedJobState.trim()
        query = query.ilike('location', `%, ${stateCode}%`)
      }
      
      if (jobSearch && jobSearch.trim() !== '') {
        const term = jobSearch.trim()
        query = query.ilike('title', `%${term}%`)
      }

      // Filtro de Temporadas H-2B por fecha de inicio (begin_date)
      if (selectedSeason === 'WINTER') {
        // Invierno: A partir del 1 de octubre (01/10)
        query = query.or(
          `begin_date.ilike.%Oct%,begin_date.ilike.%Nov%,begin_date.ilike.%Dec%,begin_date.ilike.%Jan%,begin_date.ilike.%Feb%,begin_date.ilike.%Mar%,begin_date.gte.2026-10-01`
        );
      } else if (selectedSeason === 'SUMMER') {
        // Verano: A partir del 1 de abril (01/04) hasta antes de octubre
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
  }, [jobSearch, selectedJobState, selectedJobSector, selectedSeason, jobPage])

  const filteredJobs = jobs

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
      let query = supabase.from('sponsor_companies').select('*')
      
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
  const addToCRM = (company?: string, role?: string, stateStr?: string) => {
    const compName = company || 'Empresa Generica'
    const newItem: CRMItem = {
      id: Date.now().toString(),
      company: compName,
      role: role || 'Vacante H2B',
      state: stateStr || 'US',
      status: 'guardadas',
      dateLabel: 'Guardado recién',
      lastUpdated: Date.now(),
      notes: ''
    }
    setCrmItems(prev => [newItem, ...prev])
    alert(`"${compName}" fue agregada a tu CRM.`)
  }
  
  const handleExtract = () => {
    if (!extractUrl) return
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setExtractUrl('')
      addToCRM('Oferta Extraída', 'Puesto Detectado', 'US')
    }, 1200)
  }
  
  const changeCrmStatus = (id: string, newStatus: CRMItem['status']) => {
    setCrmItems(prev => prev.map(item => {
      if (item.id === id) {
        let label = 'Actualizado hoy'
        if (newStatus === 'guardadas') label = 'Guardado recientemente'
        if (newStatus === 'postulado') label = 'Postulado hoy'
        if (newStatus === 'seguimiento') label = 'En seguimiento (Inicio)'
        if (newStatus === 'entrevista') label = 'En entrevista'
        if (newStatus === 'aceptado') label = '¡Oferta aceptada!'
        if (newStatus === 'rechazada') label = 'Rechazado'
        if (newStatus === 'no_respondido') label = 'No respondido'
        return { ...item, status: newStatus, dateLabel: label, lastUpdated: Date.now() }
      }
      return item
    }))
  }

  const deleteCrmItem = (id: string) => {
    setCrmItems(prev => prev.filter(item => item.id !== id))
  }

  const saveNotes = (id: string) => {
    setCrmItems(prev => prev.map(item => item.id === id ? { ...item, notes: tempNotes } : item))
    setEditingNotesId(null)
    setTempNotes('')
  }
  
  const toggleChecklist = (id: number) => {
    setChecklist(prev => {
      const idx = prev.findIndex(i => i.id === id)
      const isLocked = idx > 0 && !prev[idx - 1].completed && !prev[idx].completed
      if (isLocked) {
        alert('Completa el paso anterior primero para desbloquear este.')
        return prev
      }
      return prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    })
  }

  const totalJobPages = Math.ceil(totalJobsCount / ITEMS_PER_PAGE) || 1
  const totalCompanyPages = Math.ceil(totalEmployersCount / ITEMS_PER_PAGE) || 1
  const totalAgencyPages = Math.ceil(totalAgenciesCount / ITEMS_PER_PAGE) || 1
  const completedChecklistCount = checklist.filter(c => c.completed).length
  const checklistPercentage = checklist.length > 0 ? Math.round((completedChecklistCount / checklist.length) * 100) : 0
  const weeklyTarget = 15
  const applicationsThisWeek = crmItems.filter(i => i.status !== 'guardadas').length
  const searchHealthPercentage = Math.min(100, Math.round((applicationsThisWeek / weeklyTarget) * 100))

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-900 font-sans">
      
      {/* BARRA SUPERIOR */}
      <div className="bg-[#0B1528] text-white text-xs py-2 px-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-emerald-400">Supabase DB Conectado:</span>
          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium text-[11px]">
            Sincronización en Vivo
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 text-[11px]">
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-slate-400" />
            BBDD Activa
          </span>
        </div>
      </div>

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
            <UserMenu />
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setActiveTab('dashboard')
                  window.scrollTo({ top: 300, behavior: 'smooth' })
                }}
                className="bg-[#0B4079] hover:bg-[#08305c] text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Extraer Oferta</span>
              </button>
            </div>
          </div>
          <nav className="flex items-center gap-1 text-xs sm:text-sm font-medium overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'dashboard' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'jobs' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <Briefcase className="w-4 h-4 text-emerald-600" />
              Ofertas ({totalJobsCount})
            </button>
            <button
              onClick={() => setActiveTab('employers')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'employers' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <Building2 className="w-4 h-4 text-sky-600" />
              Empresas USCIS ({totalEmployersCount})
            </button>
            <button
              onClick={() => setActiveTab('agencies')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'agencies' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Agencias DOL ({totalAgenciesCount})
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'crm' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <Send className="w-4 h-4" />
              Mi CRM
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'ai' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Asistentes IA
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'checklist' ? 'text-[#1a3a8f] font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
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
                📣 Consulta en directo a Base de Datos
              </span>
              <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">
                ¡Bienvenido a tu Centro de Control H2B!
              </h1>
              <p className="text-slate-300 text-xs md:text-sm max-w-2xl mb-6 leading-relaxed">
                Navega a través de todas las ofertas laborales registradas en Supabase, empresas aprobadas por USCIS y agencias reguladas.
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
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              s.n <= currentStep ? 'bg-[#f5c518] text-[#0B2545]' : 'bg-white/15 text-white/50'
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OFERTA DE EMPLEO (DOL)</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{totalJobsCount}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Registros en Supabase
                  </p>
                </div>
                <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">EMPRESAS USCIS</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{totalEmployersCount}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● Registros en BBDD</p>
                </div>
                <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AGENCIAS REGULADAS</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{totalAgenciesCount}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● Registros en BBDD</p>
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
                    {checklist.length > 0 ? `Paso ${completedChecklistCount} de ${checklist.length}` : 'Sin iniciar'}
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
                    Mostrando 20 registros por página de <strong className="text-slate-900">{totalJobsCount} vacantes encontradas en la BBDD</strong>.
                  </p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-emerald-200 self-start md:self-auto">
                  ● Tabla: jobs
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por puesto, empresa, ciudad..."
                    value={jobSearch}
                    onChange={(e) => {
                      setJobSearch(e.target.value)
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
                  <option value="SUMMER">☀️ Verano (A partir del 1 de Abril)</option>
                  <option value="WINTER">❄️ Invierno (A partir del 1 de Octubre)</option>
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
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <p className="text-xs text-slate-500 font-medium">Cargando registros desde Supabase...</p>
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
                      <div className="flex justify-between items-start">
                        <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                          {job.job_order_id || `ID: ${job.id || idx + 1}`}
                        </span>
                        <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Verificado
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{job.title || 'Oferta de Trabajo'}</h3>
                        <p className="text-xs font-bold text-blue-700 mt-0.5">{job.employer_name || 'Empleador Registrado'}</p>
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
                      className="w-full bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2" 
                    >
                      + Guardar Oferta en Mi CRM
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <p className="text-xs text-slate-500">
                Página <strong className="text-slate-900">{jobPage}</strong> de <strong className="text-slate-900">{totalJobPages}</strong> ({totalJobsCount} ofertas totales)
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setJobPage(p => Math.max(1, p - 1))}
                  disabled={jobPage === 1 || isLoading}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button
                  onClick={() => setJobPage(p => Math.min(totalJobPages, p + 1))}
                  disabled={jobPage === totalJobPages || isLoading}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
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
                    Mostrando 20 empresas por página de un total de <strong className="text-slate-900">{totalEmployersCount} registradas</strong>.
                  </p>
                </div>
                <span className="bg-sky-50 text-sky-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-sky-200 self-start md:self-auto">
                  ● Tabla: sponsor_companies
                </span>
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
                <p className="text-xs text-slate-500 font-medium">Cargando empresas desde Supabase...</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
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
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              comp.cap_type?.includes('1st Half') ? 'bg-amber-50 text-amber-800 border border-amber-200' :
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
                            <button
                              onClick={() => addToCRM(comp.employer_name, 'Empresa USCIS', comp.state)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all"
                            >
                              + Guardar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <p className="text-xs text-slate-500">
                Página <strong className="text-slate-900">{companyPage}</strong> de <strong className="text-slate-900">{totalCompanyPages}</strong> ({totalEmployersCount} empresas totales)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCompanyPage(p => Math.max(1, p - 1))}
                  disabled={companyPage === 1 || isLoading}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button
                  onClick={() => setCompanyPage(p => Math.min(totalCompanyPages, p + 1))}
                  disabled={companyPage === totalCompanyPages || isLoading}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      
        {/* TABLA 3: AGENCIAS DOL (sponsor_agencies) */}
        {activeTab === 'agencies' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Agencias Reguladas</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Mostrando 20 agencias por página de un total de <strong className="text-slate-900">{totalAgenciesCount} autorizadas</strong>.
                  </p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-indigo-200 self-start md:self-auto">
                  ● Tabla: sponsor_agencies
                </span>
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
                <p className="text-xs text-slate-500 font-medium">Cargando agencias desde Supabase...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {agencies.map((agency, idx) => {
                  const webLink = agency.website || agency.official_website
                  return (
                    <div key={agency.id || idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-200 inline-block">
                          ✓ {agency.status || 'Lista Oficial'}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{agency.agency_name}</h3>
                        <p className="text-xs text-slate-500">📍 Ubicación: <strong className="text-slate-800">{agency.city || ''} {agency.country || ''}</strong></p>
                        
                        {webLink ? (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <span>🌐 Sitio web:</span>
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
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <span>🌐 Sitio web:</span>
                            <span className="italic">No disponible</span>
                          </p>
                        )}
                        
                        {agency.contact_email && (
                          <p className="text-[11px] text-slate-500 truncate mt-1">✉️ {agency.contact_email}</p>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => addToCRM(agency.agency_name, 'Agencia Regulada', agency.country)}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition-all mt-3"
                      >
                        + Guardar Agencia
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <p className="text-xs text-slate-500">
                Página <strong className="text-slate-900">{agencyPage}</strong> de <strong className="text-slate-900">{totalAgencyPages}</strong> ({totalAgenciesCount} agencias totales)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAgencyPage(p => Math.max(1, p - 1))}
                  disabled={agencyPage === 1 || isLoading}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button
                  onClick={() => setAgencyPage(p => Math.min(totalAgencyPages, p + 1))}
                  disabled={agencyPage === totalAgencyPages || isLoading}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-start overflow-x-auto pb-4">
              {/* COLUMNA 1: GUARDADAS */}
              <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 min-h-[500px] flex flex-col space-y-3">
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
                  {crmItems.filter(i => i.status === 'postulado').length === 0 && (
  <p className="text-[11px] text-slate-400 italic p-3 text-center leading-relaxed">
    Guarda tu primera oferta para arrancar el seguimiento.
  </p>
)}
                </div>
              </div>

              {/* COLUMNA 2: POSTULADO */}
              <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 min-h-[500px] flex flex-col space-y-3">
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
                        ✅ CV enviado correctamente
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
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[9px] text-slate-400">{item.dateLabel}</span>
                        <button onClick={() => changeCrmStatus(item.id, 'seguimiento')} className="text-[10px] font-bold text-sky-700 flex items-center gap-0.5 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-lg">
                          Seguimiento <MoveRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {crmItems.filter(i => i.status === 'postulado').length === 0 && (
  <p className="text-[11px] text-slate-400 italic p-3 text-center leading-relaxed">
    Postulá tu primera oferta guardada para verla acá.
  </p>
)}
                </div>
              </div>

              {/* COLUMNA 3: SEGUIMIENTO (7-14-21 DÍAS) */}
              <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 min-h-[500px] flex flex-col space-y-3">
                <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-[11px] text-[#b8860b] tracking-wider">SEGUIMIENTO </span>
                  <span className="bg-white text-amber-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                    {crmItems.filter(i => i.status === 'seguimiento').length}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {crmItems.filter(i => i.status === 'seguimiento').map(item => {
                    const daysPassed = Math.floor((Date.now() - item.lastUpdated) / (1000 * 60 * 60 * 24))
                    let trackingMessage = "En seguimiento activo"
                    let badgeColor = "bg-amber-50 border-amber-200 text-amber-800"
                    
                    if (daysPassed >= 14) {
                      trackingMessage = "📧 Envía tu segundo correo de seguimiento"
                      badgeColor = "bg-rose-50 border-rose-200 text-rose-800 font-bold"
                    } else if (daysPassed >= 7) {
                      trackingMessage = "✉️ Envía tu primer correo de seguimiento"
                      badgeColor = "bg-amber-100 border-amber-300 text-amber-900 font-bold"
                    }
                    return (
                      <div key={item.id} className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-2xs space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-900 text-xs leading-tight">{item.company}</h3>
                            <button onClick={() => deleteCrmItem(item.id)} className="text-slate-300 hover:text-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">{item.role}</p>
                        </div>
                        <div className={`border text-[9px] px-2 py-1.5 rounded-lg flex items-center gap-1 ${badgeColor}`}>
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{trackingMessage}</span>
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
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-[9px] text-slate-400">Día {daysPassed}</span>
                          <button onClick={() => changeCrmStatus(item.id, 'entrevista')} className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg">
                            Entrevista <MoveRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* COLUMNA 4: ENTREVISTA */}
              <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 min-h-[500px] flex flex-col space-y-3">
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
                  {crmItems.filter(i => i.status === 'postulado').length === 0 && (
  <p className="text-[11px] text-slate-400 italic p-3 text-center leading-relaxed">
    Acá vas a ver tus entrevistas agendadas.
  </p>
)}
                </div>
              </div>

              {/* COLUMNA 5: ACEPTADO */}
              <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 min-h-[500px] flex flex-col space-y-3">
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
                  {crmItems.filter(i => i.status === 'postulado').length === 0 && (
  <p className="text-[11px] text-slate-400 italic p-3 text-center leading-relaxed">
    Acá vas a ver tus ofertas aceptadas.
  </p>
)}
                </div>
              </div>

              {/* COLUMNA 6: NO RESPONDIDO / RECHAZADA */}
              <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 min-h-[500px] flex flex-col space-y-3">
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
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <span className="text-[9px] text-slate-400">{item.dateLabel}</span>
                      </div>
                    </div>
                  ))}
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
                    <p className="text-xs text-slate-500">Ajusta tu curriculum vitae al formato exigido por empleadores estadounidenses.</p>
                  </div>
                </div>
                <button className="w-full bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs py-2.5 rounded-xl transition-all">
                  Iniciar Generador de CV
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
    onClick={() => setActiveTab('ai')}
    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
  >
    Abrir Redactor
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
                <button className="w-full bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs py-2.5 rounded-xl transition-all">
                  Iniciar Simulación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CHECKLIST Y DIAGNÓSTICO */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            {/* 1. DIAGNÓSTICO / CUESTIONARIO PRIMERO */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Checklist y Hoja de Ruta H2B</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Sigue paso a paso tu trayecto de postulación laboral hasta tu cita consular.
                  </p>
                </div>
                {profileLevel && (
                  <button
                    onClick={resetProfileQuiz}
                    className="text-xs text-slate-500 underline font-semibold self-start sm:self-auto"
                  >
                    Reiniciar Diagnóstico
                  </button>
                )}
              </div>

              {!profileLevel ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Diagnóstico Inicial de Perfil</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ¿Qué tanta experiencia posees en la industria de la vacante a aplicar?
                      </label>
                      <select 
                        value={quizIndustria} 
                        onChange={(e) => setQuizIndustria(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="alta">Alta experiencia directa comprobable</option>
                        <option value="media">Experiencia indirecta o transferible</option>
                        <option value="baja">Ninguna experiencia previa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Años totales de experiencia laboral:
                      </label>
                      <select 
                        value={quizExperiencia} 
                        onChange={(e) => setQuizExperiencia(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="0">0 años / Sin experiencia laboral</option>
                        <option value="1-2">1 a 2 años</option>
                        <option value="3+">3 años o más</option>
                      </select>
                    </div>

                    <button
                      onClick={submitProfileQuiz}
                      disabled={!quizIndustria || !quizExperiencia}
                      className="bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                    >
                      Generar Mi Hoja de Ruta Personalizada
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  {/* 1. TARJETA DE PROGRESO ARRIBA */}
                  <div className="flex justify-center pb-2">
                    <AnimatedProgressCardDemo
                    completedSteps={completedChecklistCount} 
  totalSteps={checklist.length} 
  percentage={checklistPercentage}
  />
                  </div>

                  {/* 2. BANNER DE PERFIL DETECTADO */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-blue-900 uppercase">Perfil Detectado:</span>
                      <p className="text-sm font-black text-blue-700 capitalize">{profileLevel.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700">{completedChecklistCount} de {checklist.length} Pasos</span>
                      <p className="text-xs text-emerald-600 font-bold">{checklistPercentage}% completado</p>
                    </div>
                  </div>

                  {/* 3. LISTA DE PASOS DEL CHECKLIST */}
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded-xl p-4 flex items-start justify-between gap-4 transition-all ${
                          item.completed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleChecklist(item.id)}
                            className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <h4 className={`text-xs font-bold ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        {item.linkTab && !item.completed && (
                          <button
                            onClick={() => setActiveTab(item.linkTab!)}
                            className="text-[11px] font-bold text-blue-600 hover:underline shrink-0"
                          >
                            Ir a la sección →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL DETALLE DE OFERTA LABORAL (ÚNICO) */}
        {selectedJob && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            {/* overflow-hidden evita el scroll doble de la ventana blanca */}
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative overflow-hidden">
              
              {/* BOTÓN CERRAR */}
              <button 
                onClick={() => setSelectedJob(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* ENCABEZADO CON ID, TITULO Y FECHAS A LA DERECHA */}
              <div className="flex justify-between items-start gap-4 pr-6">
                <div className="space-y-1">
                  <span className="bg-slate-100 text-slate-700 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded">
                    Job Order ID: {selectedJob.job_order_id || selectedJob.id}
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
                {(selectedJob.email_to_apply || selectedJob.email || selectedJob.recruitment_email || selectedJob.emp_email) && (
                  <a
                    href={`mailto:${selectedJob.email_to_apply || selectedJob.email || selectedJob.recruitment_email || selectedJob.emp_email}`}
                    className="w-full bg-[#00A86B] hover:bg-[#008f5b] text-white font-bold text-xs py-3 rounded-xl transition-all text-center flex items-center justify-center gap-2 shadow-sm"
                  >
                    ✉️ Postular por Correo Directo
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      {/* MODAL DE POSTULACIÓN MANUAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Agregar Postulación Manual</h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualItem} className="space-y-4">
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
                  className="px-4 py-2 text-xs font-semibold bg-[#0B4079] hover:bg-[#08305c] text-white rounded-lg shadow transition-colors"
                >
                  Guardar Postulación
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
      />
    </div>
  )
}
