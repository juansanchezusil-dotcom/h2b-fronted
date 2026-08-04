'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
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
  Loader2
} from 'lucide-react'

// Cliente Supabase (instancia única para evitar duplicación de cliente)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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

interface CRMItem {
  id: string
  company: string
  role: string
  state: string
  status: 'guardadas' | 'postulado' | 'entrevista' | 'aceptado'
  dateLabel: string
}

interface ChecklistItem {
  id: number
  title: string
  desc: string
  completed: boolean
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
  
  // --- FILTROS DE BÚSQUEDA INDEPENDIENTES ---
  const [jobSearch, setJobSearch] = useState('')
  const [selectedJobState, setSelectedJobState] = useState('ALL')
  const [selectedJobSector, setSelectedJobSector] = useState('ALL')
  const [companySearch, setCompanySearch] = useState('')
  const [selectedCompanyState, setSelectedCompanyState] = useState('ALL')
  const [selectedCompanySector, setSelectedCompanySector] = useState('ALL')
  const [agencySearch, setAgencySearch] = useState('')
  
  // --- PAGINACIÓN ---
  const ITEMS_PER_PAGE = 20
  const [jobPage, setJobPage] = useState(1)
  const [companyPage, setCompanyPage] = useState(1)
  const [agencyPage, setAgencyPage] = useState(1)
  
  // Extractor IA
  const [extractUrl, setExtractUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // CRM LOCAL / CHECKLIST
  const [crmItems, setCrmItems] = useState<CRMItem[]>([
    { id: '1', company: 'Lone Star Landscaping', role: 'Operador Jardín', state: 'TX', status: 'guardadas', dateLabel: 'Guardado recientemente' }
  ])
  
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, title: 'Revisión y Formato de CV en Inglés', desc: 'Asegúrate de estructurar tu CV con el estándar estadounidense.', completed: true },
    { id: 2, title: 'Identificación de Oferta y Empleador DOL', desc: 'Verifica la certificación laboral en el portal oficial del DOL.', completed: true },
    { id: 3, title: 'Envío de Postulación y Contacto Directo', desc: 'Escribe al correo oficial de aplicación o reclutador registrado.', completed: false },
    { id: 4, title: 'Entrevista Laboral con el Patrocinador', desc: 'Prepárate con el asistente IA para preguntas frecuentes.', completed: false },
    { id: 5, title: 'Aprobación de Petición I-129 en USCIS', desc: 'El empleador envía la notificación de aprobación de la petición.', completed: false },
    { id: 6, title: 'Llenado de Formulario DS-160', desc: 'Completa tu solicitud consular de visa de trabajo.', completed: false },
    { id: 7, title: 'Cita Consular y Pago de Tasa MRV', desc: 'Asiste a tu cita en el consulado con la documentación requerida.', completed: false }
  ])

  // ==========================================
  // CARGA INICIAL DE TOTALES
  // ==========================================
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

  // ==========================================
  // CONSULTAS DE OFERTAS LABORALES
  // ==========================================
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true)
      const from = (jobPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        
      if (selectedJobState && selectedJobState !== 'ALL') {
        const match = selectedJobState.match(/\(([^)]+)\)/)
        const stateCode = match ? match[1] : selectedJobState.trim()
        query = query.ilike('location', `%, ${stateCode}%`)
      }
      
      if (jobSearch && jobSearch.trim() !== '') {
        const term = jobSearch.trim()
        query = query.ilike('title', `%${term}%`)
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
  }, [jobSearch, selectedJobState, selectedJobSector, jobPage])

  const filteredJobs = jobs

  // ==========================================
  // CONSULTAS DE EMPRESAS USCIS
  // ==========================================
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
  }, [companySearch, selectedCompanyState, selectedCompanySector, companyPage, activeTab])

  // ==========================================
  // CONSULTAS DE AGENCIAS DOL
  // ==========================================
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
      // Ordena primero las que tienen sitio web y luego por nombre
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
  }, [activeTab, agencyPage, agencySearch])

  // ACCIONES CRM
  const addToCRM = (company?: string, role?: string, stateStr?: string) => {
    const compName = company || 'Empresa Generica'
    const newItem: CRMItem = {
      id: Date.now().toString(),
      company: compName,
      role: role || 'Vacante H2B',
      state: stateStr || 'US',
      status: 'guardadas',
      dateLabel: 'Guardado recién'
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
  
  const moveCrmItem = (id: string) => {
    setCrmItems(prev => prev.map(item => {
      if (item.id === id) {
        if (item.status === 'guardadas') return { ...item, status: 'postulado', dateLabel: 'Postulado hoy' }
        if (item.status === 'postulado') return { ...item, status: 'entrevista', dateLabel: 'En entrevista' }
        if (item.status === 'entrevista') return { ...item, status: 'aceptado', dateLabel: 'Oferta recibida' }
      }
      return item
    }))
  }
  
  const deleteCrmItem = (id: string) => {
    setCrmItems(prev => prev.filter(item => item.id !== id))
  }
  
  const toggleChecklist = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item))
  }

  const totalJobPages = Math.ceil(totalJobsCount / ITEMS_PER_PAGE) || 1
  const totalCompanyPages = Math.ceil(totalEmployersCount / ITEMS_PER_PAGE) || 1
  const totalAgencyPages = Math.ceil(totalAgenciesCount / ITEMS_PER_PAGE) || 1
  const completedChecklistCount = checklist.filter(c => c.completed).length
  const checklistPercentage = Math.round((completedChecklistCount / checklist.length) * 100)

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
                  <span className="font-black text-blue-600 text-lg leading-tight">PRO</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-none">Sistema Operativo H2B</p>
              </div>
            </div>
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
                activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'jobs' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4 text-emerald-600" />
              Ofertas ({totalJobsCount})
            </button>
            <button
              onClick={() => setActiveTab('employers')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'employers' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-sky-600" />
              Empresas USCIS ({totalEmployersCount})
            </button>
            <button
              onClick={() => setActiveTab('agencies')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'agencies' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Agencias DOL ({totalAgenciesCount})
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'crm' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-4 h-4" />
              Mi CRM
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'ai' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Asistentes IA
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'checklist' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
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
                  <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Paso {completedChecklistCount} de {checklist.length}</p>
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
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
                  value={selectedJobState}
                  onChange={(e) => {
                    setSelectedJobState(e.target.value)
                    setJobPage(1)
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="ALL">Todos los Estados (EE. UU.)</option>
                  <option value="AL">Alabama (AL)</option>
                  <option value="AK">Alaska (AK)</option>
                  <option value="AZ">Arizona (AZ)</option>
                  <option value="AR">Arkansas (AR)</option>
                  <option value="CA">California (CA)</option>
                  <option value="CO">Colorado (CO)</option>
                  <option value="CT">Connecticut (CT)</option>
                  <option value="DE">Delaware (DE)</option>
                  <option value="FL">Florida (FL)</option>
                  <option value="GA">Georgia (GA)</option>
                  <option value="HI">Hawaii (HI)</option>
                  <option value="ID">Idaho (ID)</option>
                  <option value="IL">Illinois (IL)</option>
                  <option value="IN">Indiana (IN)</option>
                  <option value="IA">Iowa (IA)</option>
                  <option value="KS">Kansas (KS)</option>
                  <option value="KY">Kentucky (KY)</option>
                  <option value="LA">Louisiana (LA)</option>
                  <option value="ME">Maine (ME)</option>
                  <option value="MD">Maryland (MD)</option>
                  <option value="MA">Massachusetts (MA)</option>
                  <option value="MI">Michigan (MI)</option>
                  <option value="MN">Minnesota (MN)</option>
                  <option value="MS">Mississippi (MS)</option>
                  <option value="MO">Missouri (MO)</option>
                  <option value="MT">Montana (MT)</option>
                  <option value="NE">Nebraska (NE)</option>
                  <option value="NV">Nevada (NV)</option>
                  <option value="NH">New Hampshire (NH)</option>
                  <option value="NJ">New Jersey (NJ)</option>
                  <option value="NM">New Mexico (NM)</option>
                  <option value="NY">New York (NY)</option>
                  <option value="NC">North Carolina (NC)</option>
                  <option value="ND">North Dakota (ND)</option>
                  <option value="OH">Ohio (OH)</option>
                  <option value="OK">Oklahoma (OK)</option>
                  <option value="OR">Oregon (OR)</option>
                  <option value="PA">Pennsylvania (PA)</option>
                  <option value="RI">Rhode Island (RI)</option>
                  <option value="SC">South Carolina (SC)</option>
                  <option value="SD">South Dakota (SD)</option>
                  <option value="TN">Tennessee (TN)</option>
                  <option value="TX">Texas (TX)</option>
                  <option value="UT">Utah (UT)</option>
                  <option value="VT">Vermont (VT)</option>
                  <option value="VA">Virginia (VA)</option>
                  <option value="WA">Washington (WA)</option>
                  <option value="WV">West Virginia (WV)</option>
                  <option value="WI">Wisconsin (WI)</option>
                  <option value="WY">Wyoming (WY)</option>
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
                  ● Tabla: employers
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value)
                      setCompanyPage(1)
                    }}
                    placeholder="Buscar empresa por nombre o ciudad..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <select
                  value={selectedCompanyState}
                  onChange={(e) => {
                    setSelectedCompanyState(e.target.value)
                    setCompanyPage(1)
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="ALL">Todos los Estados (EE. UU.)</option>
                  <option value="AL">Alabama (AL)</option>
                  <option value="AK">Alaska (AK)</option>
                  <option value="AZ">Arizona (AZ)</option>
                  <option value="AR">Arkansas (AR)</option>
                  <option value="CA">California (CA)</option>
                  <option value="CO">Colorado (CO)</option>
                  <option value="CT">Connecticut (CT)</option>
                  <option value="DE">Delaware (DE)</option>
                  <option value="FL">Florida (FL)</option>
                  <option value="GA">Georgia (GA)</option>
                  <option value="HI">Hawaii (HI)</option>
                  <option value="ID">Idaho (ID)</option>
                  <option value="IL">Illinois (IL)</option>
                  <option value="IN">Indiana (IN)</option>
                  <option value="IA">Iowa (IA)</option>
                  <option value="KS">Kansas (KS)</option>
                  <option value="KY">Kentucky (KY)</option>
                  <option value="LA">Louisiana (LA)</option>
                  <option value="ME">Maine (ME)</option>
                  <option value="MD">Maryland (MD)</option>
                  <option value="MA">Massachusetts (MA)</option>
                  <option value="MI">Michigan (MI)</option>
                  <option value="MN">Minnesota (MN)</option>
                  <option value="MS">Mississippi (MS)</option>
                  <option value="MO">Missouri (MO)</option>
                  <option value="MT">Montana (MT)</option>
                  <option value="NE">Nebraska (NE)</option>
                  <option value="NV">Nevada (NV)</option>
                  <option value="NH">New Hampshire (NH)</option>
                  <option value="NJ">New Jersey (NJ)</option>
                  <option value="NM">New Mexico (NM)</option>
                  <option value="NY">New York (NY)</option>
                  <option value="NC">North Carolina (NC)</option>
                  <option value="ND">North Dakota (ND)</option>
                  <option value="OH">Ohio (OH)</option>
                  <option value="OK">Oklahoma (OK)</option>
                  <option value="OR">Oregon (OR)</option>
                  <option value="PA">Pennsylvania (PA)</option>
                  <option value="RI">Rhode Island (RI)</option>
                  <option value="SC">South Carolina (SC)</option>
                  <option value="SD">South Dakota (SD)</option>
                  <option value="TN">Tennessee (TN)</option>
                  <option value="TX">Texas (TX)</option>
                  <option value="UT">Utah (UT)</option>
                  <option value="VT">Vermont (VT)</option>
                  <option value="VA">Virginia (VA)</option>
                  <option value="WA">Washington (WA)</option>
                  <option value="WV">West Virginia (WV)</option>
                  <option value="WI">Wisconsin (WI)</option>
                  <option value="WY">Wyoming (WY)</option>
                </select>
                <select
                  value={selectedCompanySector}
                  onChange={(e) => {
                    setSelectedCompanySector(e.target.value)
                    setCompanyPage(1)
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="ALL">Todos los Sectores</option>
                  <option value="Hotelería">Hotelería y Restaurantes</option>
                  <option value="Construcción">Construcción y Mantenimiento</option>
                  <option value="Paisajismo">Paisajismo y Jardinería (Landscaping)</option>
                  <option value="Agriculture">Agricultura y Cosecha</option>
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
                        <th className="p-4">Ubicación</th>
                        <th className="p-4">Tasa Aprobación</th>
                        <th className="p-4">Consular Processed</th>
                        <th className="p-4">Visas Aprobadas</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {employers.map((comp, idx) => (
                        <tr key={comp.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-slate-900">{comp.employer_name || 'Sin Nombre'}</td>
                          <td className="p-4">{comp.worksite_states || comp.state || '-'}</td>
                          <td className="p-4">
                            <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                              {comp.approval_rate || 'Alta'}
                            </span>
                          </td>
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
              <div className="w-full md:w-96">
                <input
                  type="text"
                  value={agencySearch}
                  onChange={(e) => {
                    setAgencySearch(e.target.value)
                    setAgencyPage(1)
                  }}
                  placeholder="Buscar agencia por nombre, ciudad o país..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
        
        {/* MI CRM */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">CRM de Postulaciones H2B</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Organiza y realiza seguimiento a cada oferta guardada de tu base de datos.
                </p>
              </div>
              <button 
                onClick={() => {
                  const companyName = prompt('Nombre de la empresa:')
                  if (companyName) addToCRM(companyName, 'Postulación Manual', 'US')
                }}
                className="bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Agregar Postulación Manual
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 min-h-[450px] flex flex-col space-y-3">
                <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-xs text-slate-700 tracking-wider">GUARDADAS</span>
                  <span className="bg-white text-slate-700 font-bold text-[11px] px-2 py-0.5 rounded-full border border-slate-200">
                    {crmItems.filter(i => i.status === 'guardadas').length}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {crmItems.filter(i => i.status === 'guardadas').map(item => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                      <h3 className="font-bold text-slate-900 text-sm">{item.company}</h3>
                      <p className="text-xs text-slate-500">{item.role}</p>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <button onClick={() => moveCrmItem(item.id)} className="text-xs font-bold text-blue-600 flex items-center gap-1">
                          Mover <MoveRight className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteCrmItem(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 min-h-[450px] flex flex-col space-y-3">
                <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-xs text-sky-800 tracking-wider">ENVIADO / POSTULADO</span>
                  <span className="bg-white text-sky-700 font-bold text-[11px] px-2 py-0.5 rounded-full border border-slate-200">
                    {crmItems.filter(i => i.status === 'postulado').length}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {crmItems.filter(i => i.status === 'postulado').map(item => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                      <h3 className="font-bold text-slate-900 text-sm">{item.company}</h3>
                      <p className="text-xs text-slate-500">{item.role}</p>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <button onClick={() => moveCrmItem(item.id)} className="text-xs font-bold text-blue-600 flex items-center gap-1">
                          Mover <MoveRight className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteCrmItem(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 min-h-[450px] flex flex-col space-y-3">
                <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-xs text-amber-800 tracking-wider">EN ENTREVISTA</span>
                  <span className="bg-white text-amber-700 font-bold text-[11px] px-2 py-0.5 rounded-full border border-slate-200">
                    {crmItems.filter(i => i.status === 'entrevista').length}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {crmItems.filter(i => i.status === 'entrevista').map(item => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                      <h3 className="font-bold text-slate-900 text-sm">{item.company}</h3>
                      <p className="text-xs text-slate-500">{item.role}</p>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <button onClick={() => moveCrmItem(item.id)} className="text-xs font-bold text-blue-600 flex items-center gap-1">
                          Mover <MoveRight className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteCrmItem(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 min-h-[450px] flex flex-col space-y-3">
                <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-xs text-emerald-800 tracking-wider">ACEPTADO</span>
                  <span className="bg-white text-emerald-700 font-bold text-[11px] px-2 py-0.5 rounded-full border border-slate-200">
                    {crmItems.filter(i => i.status === 'aceptado').length}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {crmItems.filter(i => i.status === 'aceptado').map(item => (
                    <div key={item.id} className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm space-y-2">
                      <h3 className="font-bold text-slate-900 text-sm">{item.company}</h3>
                      <p className="text-xs text-slate-500">{item.role}</p>
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button onClick={() => deleteCrmItem(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* ASISTENTES IA */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h1 className="text-2xl font-black text-slate-900">Asistentes IA</h1>
              <p className="text-xs text-slate-500 mt-1">Generación de currículum y carta de presentación adaptados.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <FileText className="w-6 h-6 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-lg">Generador de CV (EE.UU.)</h3>
                <button onClick={() => alert('Abriendo Generador de CV...')} className="bg-[#0B4079] text-white font-bold text-xs px-4 py-2.5 rounded-xl">
                  Iniciar Generador CV
                </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <UserCheck className="w-6 h-6 text-blue-500" />
                <h3 className="font-bold text-slate-900 text-lg">Carta de Presentación (Cover Letter)</h3>
                <button onClick={() => alert('Abriendo Cover Letter...')} className="bg-[#0B4079] text-white font-bold text-xs px-4 py-2.5 rounded-xl">
                  Crear Cover Letter
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Checklist H2B</h1>
                <p className="text-xs text-slate-500 mt-1">Paso a paso de tu proceso visa H2B.</p>
              </div>
              <span className="text-lg font-black text-blue-600">{checklistPercentage}% Completado</span>
            </div>
            <div className="bg-[#ffffff] border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
              {checklist.map((item) => (
                <div key={item.id} onClick={() => toggleChecklist(item.id)} className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer ${item.completed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/50 border-slate-200'}`}>
                  <input type="checkbox" checked={item.completed} readOnly className="mt-1 h-4 w-4" />
                  <div>
                    <h3 className={`font-bold text-sm ${item.completed ? 'text-emerald-900 line-through' : 'text-slate-900'}`}>Paso {item.id}: {item.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* MODAL DETALLES DE LA OFERTA */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="p-6 border-b-2 border-blue-200/80 relative">
                <div className="flex justify-between items-start pr-8">
                  <div className="space-y-0.5 max-w-[65%]">
                    <h2 className="text-xl font-bold text-[#1E3A8A] leading-snug">
                      {selectedJob.title}
                    </h2>
                    <p className="text-xs font-semibold text-slate-600">
                      {selectedJob.employer_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {selectedJob.location || `${selectedJob.city || ''} ${selectedJob.state || ''}`}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                    <p><strong>Begin date:</strong> {selectedJob.begin_date || selectedJob.start_date || 'N/A'}</p>
                    <p><strong>End date:</strong> {selectedJob.end_date || 'N/A'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="absolute top-5 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors text-base font-medium"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-5 text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <p className="text-base font-bold text-slate-900">
                    {selectedJob.wage || 'Salario no especificado'}
                  </p>
                  {(selectedJob.job_order_url || selectedJob.link || selectedJob.url) && (
                    <a 
                      href={selectedJob.job_order_url || selectedJob.link || selectedJob.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
                    >
                      View Job Order 📄
                    </a>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#1E3A8A]">
                    Recruitment Information
                  </h3>
                  <div className="space-y-1.5 text-slate-800">
                    {(selectedJob.phone_to_apply || selectedJob.phone_number || selectedJob.phone) ? (
                      <p>
                        <strong>Telephone Number to Apply:</strong>{' '}
                        <a 
                          href={`tel:${selectedJob.phone_to_apply || selectedJob.phone_number || selectedJob.phone}`}
                          className="text-[#2563EB] hover:underline font-medium"
                        >
                          {selectedJob.phone_to_apply || selectedJob.phone_number || selectedJob.phone}
                        </a>
                      </p>
                    ) : (
                      <p className="text-slate-400 italic">
                        Telephone Number to Apply: N/A
                      </p>
                    )}
                    {selectedJob.email_to_apply || selectedJob.email ? (
                      <p>
                        <strong>Email address to Apply:</strong>{' '}
                        <a 
                          href={`mailto:${selectedJob.email_to_apply || selectedJob.email}`} 
                          className="text-[#2563EB] hover:underline font-medium"
                        >
                          {selectedJob.email_to_apply || selectedJob.email}
                        </a>
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-[#1E3A8A]">
                    Job Description
                  </h3>
                  <div className="space-y-2 text-slate-800 leading-relaxed">
                    <p><strong>Full Time:</strong> {(selectedJob.full_time ?? selectedJob.is_full_time) ? 'Yes' : 'No'}</p>
                    <p><strong>Number of Workers Requested:</strong> {selectedJob.workers_requested || selectedJob.positions || 'N/A'}</p>
                    <p className="text-slate-700">
                      <strong>Job Duties:</strong>{' '}
                      {selectedJob.job_duties || 
                       selectedJob.job_description || 
                       selectedJob.duties || 
                       selectedJob.description || 
                       selectedJob.job_duties_description || 
                       'N/A'}
                    </p>
                    <p className="text-slate-700 pt-1">
                      <strong>Job Classification:</strong> {selectedJob.job_classification || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="bg-[#E2E8F0] hover:bg-slate-300 text-slate-800 font-semibold text-xs px-6 py-2 rounded-xl transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}