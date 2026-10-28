'use client'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

import OnboardingModal from '@/components/OnboardingModal';
import UserMenu from '@/components/UserMenu';
import ThemeToggle from '@/components/ThemeToggle';
import ScamDetectorTab from '@/components/ScamDetectorTab';
import InterviewSimulatorTab from '@/components/InterviewSimulatorTab';
import {
  Briefcase,
  Building2,
  ShieldCheck,
  Send,
  CheckCircle2,
  Search,
  Sparkles,
  TrendingUp,
  FileText,
  UserCheck,
  Clock,
  Check,
  Plane,
  Compass,
} from 'lucide-react'
import { EmailAssistantTab } from '../components/EmailAssistantTab'
import H2BMap from '@/components/H2BMap';
import { loadSteps, CHECKLIST_TOTAL_TASKS } from '@/lib/checklistSteps';
import CVBuilderModal from '@/components/CVBuilderModal';
import LogoMark from '@/components/LogoMark';
import MobileTabBar from '@/components/MobileTabBar';
import InstallAppBanner from '@/components/InstallAppBanner';
import { PushPromptCard } from '@/components/PushNotifications';
import PullToRefresh from '@/components/PullToRefresh';
import AssistantModal from '@/components/AssistantModal';
import MembershipNotices from '@/components/MembershipNotices';
import ApplyFlowModal from '@/components/ApplyFlowModal';
import { useBackToClose } from '@/hooks/useBackToClose';
import { useLastSeen } from '@/hooks/useLastSeen';

// Cliente Supabase (instancia única para evitar duplicación de cliente)
import { supabase } from '@/lib/supabaseClient'
import { goalFor } from '@/lib/goals'
import {
  REPLY_LABELS, labelForStatus, crmKey,
  type Job, type SponsorCompany, type SponsorAgency, type CRMItem, type ApplyFlowJob,
} from '@/lib/h2b'

// Pestañas y ventanas que no se ven al abrir la app: se descargan recién cuando se usan
const EmployersTab = dynamic(() => import('@/components/EmployersTab'))
const AgenciesTab = dynamic(() => import('@/components/AgenciesTab'))
const JobsTab = dynamic(() => import('@/components/JobsTab'))
const CrmTab = dynamic(() => import('@/components/CrmTab'))
const AiToolsTab = dynamic(() => import('@/components/AiToolsTab'))
const JobDetailModal = dynamic(() => import('@/components/JobDetailModal'))

// Columnas que la app lee de la tabla applications
interface ApplicationRow {
  id: string
  company_name: string
  job_title: string | null
  state: string | null
  status: CRMItem['status']
  created_at: string
  last_updated: string | null
  notes: string | null
  followup1_sent_at: string | null
  followup2_sent_at: string | null
  reply_type: CRMItem['replyType']
  reply_at: string | null
}

type Tab = 'dashboard' | 'jobs' | 'employers' | 'agencies' | 'crm' | 'ai' | 'checklist'
const TABS: Tab[] = ['dashboard', 'jobs', 'employers', 'agencies', 'crm', 'ai', 'checklist']
// Orden de la barra inferior del celular (las de "Más" al final); el deslizamiento lo sigue
const SWIPE_ORDER: Tab[] = ['dashboard', 'jobs', 'crm', 'ai', 'employers', 'agencies', 'checklist']

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  // La hora "de ahora" para contar días (seguimientos, meta semanal). Se lee una vez y se refresca cada minuto:
  // leer el reloj en cada render da números que cambian solos entre un dibujo y otro
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])
  // Celular: los filtros de Ofertas viven en un panel que sube desde abajo
  const [jobFiltersOpen, setJobFiltersOpen] = useState(false)
  useBackToClose(jobFiltersOpen, () => setJobFiltersOpen(false))
  // Celular: el header se esconde al bajar y vuelve al subir, para ganar pantalla al leer
  const [headerHidden, setHeaderHidden] = useState(false)
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) < 8) return
      setHeaderHidden(y > lastY && y > 120 && window.innerWidth < 640)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Al volver a abrir la app, retoma la última pestaña que usaste
  const tabRestored = useRef(false)
  useEffect(() => {
    if (!tabRestored.current) {
      tabRestored.current = true
      // Un aviso push abre la app con ?tab=crm o ?tab=jobs: esa pestaña manda sobre la guardada
      const params = new URLSearchParams(window.location.search)
      const fromLink = params.get('tab')
      if (fromLink) {
        params.delete('tab')
        const qs = params.toString()
        window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
      }
      const saved = fromLink && (TABS as string[]).includes(fromLink) ? fromLink : localStorage.getItem('jta:lastTab')
      if (saved && (TABS as string[]).includes(saved) && saved !== activeTab) {
        // localStorage solo existe en el navegador: leerlo al iniciar el estado rompería la hidratación
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveTab(saved as Tab)
        return
      }
    }
    localStorage.setItem('jta:lastTab', activeTab)
  }, [activeTab])

  // Entrada corta del contenido al cambiar de pestaña, desde el lado hacia donde vas
  const mainRef = useRef<HTMLElement>(null)
  const prevTab = useRef(activeTab)
  useEffect(() => {
    if (prevTab.current === activeTab) return
    setJobFiltersOpen(false)
    setHeaderHidden(false)
    const forward = SWIPE_ORDER.indexOf(activeTab) > SWIPE_ORDER.indexOf(prevTab.current)
    prevTab.current = activeTab
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    mainRef.current?.animate(
      [{ opacity: 0, transform: `translateX(${forward ? 24 : -24}px)` }, { opacity: 1, transform: 'none' }],
      { duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    )
  }, [activeTab])

  // Deslizar a la izquierda o derecha sobre el contenido cambia de pestaña (celular),
  // en el mismo orden que la barra inferior
  const swipeStart = useRef<{ x: number; y: number; t: number } | null>(null)
  const handleSwipeStart = (e: React.TouchEvent<HTMLElement>) => {
    swipeStart.current = null
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    // Los bordes de la pantalla son el gesto "atrás" del sistema
    if (touch.clientX < 24 || touch.clientX > window.innerWidth - 24) return
    // No robar el gesto a campos, modales ni zonas con scroll horizontal (tablas, CRM)
    let el = e.target as HTMLElement | null
    while (el && el !== e.currentTarget) {
      if (el.matches('input, textarea, select, [contenteditable="true"], [role="dialog"], .fixed, [data-no-swipe]')) return
      if (el.scrollWidth > el.clientWidth + 1) {
        const overflowX = getComputedStyle(el).overflowX
        if (overflowX === 'auto' || overflowX === 'scroll') return
      }
      el = el.parentElement
    }
    swipeStart.current = { x: touch.clientX, y: touch.clientY, t: Date.now() }
  }
  const handleSwipeEnd = (e: React.TouchEvent<HTMLElement>) => {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start || window.getSelection()?.toString()) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    // Solo gestos claros: largos, rápidos y casi horizontales (no confunde con el scroll vertical)
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2 || Date.now() - start.t > 600) return
    const next = SWIPE_ORDER[SWIPE_ORDER.indexOf(activeTab) + (dx < 0 ? 1 : -1)]
    if (!next) return
    setActiveTab(next)
    window.scrollTo({ top: 0 })
  }

  // --- ESTADOS DE DATOS REALES ---
  const [jobs, setJobs] = useState<Job[]>([])
  const [totalJobsCount, setTotalJobsCount] = useState<number>(0)
  const [employers, setEmployers] = useState<SponsorCompany[]>([])
  const [totalEmployersCount, setTotalEmployersCount] = useState<number>(0)
  const [agencies, setAgencies] = useState<SponsorAgency[]>([])
  const [totalAgenciesCount, setTotalAgenciesCount] = useState<number>(0)
  // Totales del catálogo completo (sin filtros): no cambian al buscar
  const [catalogTotals, setCatalogTotals] = useState({ jobs: 0, employers: 0, agencies: 0 })
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  useBackToClose(!!selectedJob, () => setSelectedJob(null))
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [profileIndustry, setProfileIndustry] = useState('')
  const [profileRole, setProfileRole] = useState('')
  const [onboardingUserId, setOnboardingUserId] = useState<string>('')
  // Registra la última visita (como máximo una vez por hora) para el seguimiento de actividad
  useLastSeen(onboardingUserId)

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
  const [showScamDetector, setShowScamDetector] = useState(false)
  const [showInterviewSimulator, setShowInterviewSimulator] = useState(false)
  // Postulación con la que se abrió el simulador (botón "Practicar esta entrevista" de una tarjeta)
  const [simulatorJob, setSimulatorJob] = useState<{ company: string; role: string } | null>(null)
  const [hasCv, setHasCv] = useState(false)
  const [showCvBuilder, setShowCvBuilder] = useState(false)
  // Oferta a la que se adapta el CV (null = CV general)
  const [cvJob, setCvJob] = useState<{ title: string; employerName: string; location?: string; duties?: string } | null>(null)
  // Empresa/puesto que precargan el redactor cuando se abre desde una tarjeta del CRM
  const [emailDraftFor, setEmailDraftFor] = useState<{ company: string; role: string; type: 'initial' | 'followup_7d' | 'followup_14d' } | null>(null)
  // Día real en que cada postulación pasó a "postulado" (historial de estados); sin historial se usa la creación de la tarjeta
  const [appliedAtById, setAppliedAtById] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!onboardingUserId) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('application_events')
        .select('application_id, created_at')
        .in('to_status', ['postulado', 'seguimiento'])
        .eq('source', 'trigger')
        .order('created_at', { ascending: true })
        .limit(2000)
      if (cancelled || !data) return
      const map: Record<string, number> = {}
      for (const e of data as { application_id: string | null; created_at: string }[]) {
        if (e.application_id && map[e.application_id] === undefined) map[e.application_id] = new Date(e.created_at).getTime()
      }
      setAppliedAtById(map)
    })()
    return () => {
      cancelled = true
    }
  }, [onboardingUserId, crmItems.length])
  // Oferta que se está postulando ahora mismo (flujo "Postular ahora" del detalle)
  const [applyFlowJob, setApplyFlowJob] = useState<ApplyFlowJob | null>(null)

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
  // Primera visita en celular: enseña que se puede deslizar entre secciones (una sola vez)
  useEffect(() => {
    if (!window.matchMedia('(max-width: 639px)').matches || localStorage.getItem('jta:swipeHint')) return
    const timer = setTimeout(() => {
      localStorage.setItem('jta:swipeHint', '1')
      setToastMessage('Tip: desliza a los lados para cambiar de sección')
      setTimeout(() => setToastMessage(null), 4000)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])
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
      const mapped: CRMItem[] = (data as ApplicationRow[]).map((row) => ({
        id: row.id,
        company: row.company_name,
        role: row.job_title || 'Vacante H2B',
        state: row.state || 'US',
        status: row.status as CRMItem['status'],
        dateLabel: labelForStatus(row.status),
        lastUpdated: new Date(row.last_updated || row.created_at).getTime(),
        createdAt: new Date(row.created_at).getTime(),
        notes: row.notes || '',
        followup1At: row.followup1_sent_at ? new Date(row.followup1_sent_at).getTime() : null,
        followup2At: row.followup2_sent_at ? new Date(row.followup2_sent_at).getTime() : null,
        replyType: row.reply_type || null,
        replyAt: row.reply_at ? new Date(row.reply_at).getTime() : null,
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
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) console.error('Error de auth al verificar perfil:', userError)

    if (user) {
      setOnboardingUserId(user.id)
      refreshHasCv(user.id)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('perfil_completado, industry, target_role')
        .eq('id', user.id)
        .maybeSingle()

      if (error) console.error('Error consultando perfil:', error)

const isComplete = !error && !!profile && profile.perfil_completado === true
setProfileCompleted(isComplete)
setProfileIndustry(profile?.industry || '')
setProfileRole(profile?.target_role || '')

if (!isComplete) {
  setShowOnboarding(true)
}
    } else {
    }
  }
  checkUserProfile()
}, [])

// ===== MI MAPA =====
// Los pasos manuales (pasaporte y DS-160) viven en la base (con copia en el navegador); aquí solo se leen
// para el recuadro del dashboard, cada vez que se vuelve a una pestaña.
const [manualSteps, setManualSteps] = useState({ passport: false, ds160: false })
useEffect(() => {
  if (!onboardingUserId) return
  let cancelled = false
  loadSteps(supabase, onboardingUserId).then((s) => {
    if (!cancelled) setManualSteps(s)
  })
  return () => {
    cancelled = true
  }
}, [activeTab, onboardingUserId])

const [matchScores, setMatchScores] = useState<Record<string, { score: number; breakdown: unknown }>>({})

useEffect(() => {
  async function loadMatchScores() {
    if (!onboardingUserId) return
    try {
      const res = await fetch('/api/jobs/matches')
      if (!res.ok) return
      const data = await res.json()
      const map: Record<string, { score: number; breakdown: unknown }> = {}
      ;(data as { job_id: string; match_score: number; match_breakdown: unknown }[]).forEach((row) => {
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
  // Las tres cuentas van a la vez: antes se esperaban una tras otra
  const fetchInitialCounts = async () => {
    const [{ count: cJobs }, { count: cEmployers }, { count: cAgencies }] = await Promise.all([
      supabase.from('jobs').select('*', { count: 'exact', head: true }),
      supabase.from('sponsor_companies').select('*', { count: 'exact', head: true }),
      supabase.from('sponsor_agencies').select('*', { count: 'exact', head: true }),
    ])
    if (cJobs !== null) { setTotalJobsCount(cJobs); setCatalogTotals(t => ({ ...t, jobs: cJobs })) }
    if (cEmployers !== null) { setTotalEmployersCount(cEmployers); setCatalogTotals(t => ({ ...t, employers: cEmployers })) }
    if (cAgencies !== null) { setTotalAgenciesCount(cAgencies); setCatalogTotals(t => ({ ...t, agencies: cAgencies })) }
    setCatalogLoaded(true)
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

// Días desde que se postuló de verdad (no desde que se guardó la tarjeta)
const daysSinceApplied = (item: CRMItem) => Math.floor((now - (appliedAtById[item.id] ?? item.createdAt)) / (1000 * 60 * 60 * 24))

// El correo que corresponde según el día: el mismo criterio del aviso que ve la persona en la tarjeta
const emailTypeFor = (item: CRMItem): 'initial' | 'followup_7d' | 'followup_14d' => {
  if (item.status !== 'postulado' && item.status !== 'seguimiento') return 'initial'
  const days = daysSinceApplied(item)
  return days >= 14 ? 'followup_14d' : days >= 7 ? 'followup_7d' : 'initial'
}

// La persona confirma que ya envió su primer (1) o segundo (2) seguimiento: queda registrado con la fecha
const markFollowupSent = async (item: CRMItem, n: 1 | 2): Promise<boolean> => {
  const when = new Date()
  const column = n === 1 ? 'followup1_sent_at' : 'followup2_sent_at'
  const { error } = await supabase.from('applications').update({ [column]: when.toISOString() }).eq('id', item.id)
  if (error) {
    console.error('No se pudo registrar el seguimiento:', error)
    showToast('❌ No se pudo registrar el seguimiento. Intenta de nuevo.')
    return false
  }
  setCrmItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, [n === 1 ? 'followup1At' : 'followup2At']: when.getTime() } : i)))
  showToast(n === 1 ? '✅ Primer seguimiento registrado' : '✅ Segundo seguimiento registrado')
  return true
}

// La persona registra (o quita) la respuesta del empleador
const setEmployerReply = async (item: CRMItem, type: CRMItem['replyType']) => {
  const when = type ? new Date() : null
  const { error } = await supabase
    .from('applications')
    .update({ reply_type: type, reply_at: when ? when.toISOString() : null })
    .eq('id', item.id)
  if (error) {
    console.error('No se pudo registrar la respuesta del empleador:', error)
    showToast('❌ No se pudo guardar. Intenta de nuevo.')
    return
  }
  setCrmItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, replyType: type, replyAt: when ? when.getTime() : null } : i)))
  showToast(type ? '✅ Respuesta registrada' : 'Respuesta quitada')
}

const renderReplyControl = (item: CRMItem) =>
  item.replyType ? (
    <div className="flex items-center justify-between gap-2 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 rounded-lg px-2 py-1.5">
      <span className="text-xs sm:text-[10px] font-semibold text-violet-800 dark:text-violet-300">📩 {REPLY_LABELS[item.replyType]}</span>
      <button onClick={() => setEmployerReply(item, null)} className="min-h-11 sm:min-h-0 px-2 sm:px-0 text-xs sm:text-[9px] underline text-violet-700 dark:text-violet-300 shrink-0">
        Quitar
      </button>
    </div>
  ) : (
    <select
      aria-label="Registrar que el empleador respondió"
      value=""
      onChange={(e) => e.target.value && setEmployerReply(item, e.target.value as CRMItem['replyType'])}
      className="w-full min-h-11 sm:min-h-0 text-xs sm:text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 rounded-lg py-1.5 px-2"
    >
      <option value="">📩 El empleador respondió…</option>
      {(Object.keys(REPLY_LABELS) as (keyof typeof REPLY_LABELS)[]).map((k) => (
        <option key={k} value={k}>
          {REPLY_LABELS[k]}
        </option>
      ))}
    </select>
  )

const openEmailFor = (item: CRMItem) => {
  setEmailDraftFor({ company: item.company, role: item.role, type: emailTypeFor(item) })
  setShowEmailAssistant(true)
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
// Mismos 5 elementos que el Mapa: perfil, CV, pasaporte, 5 ofertas guardadas y DS-160
const checklistDone = [profileCompleted, hasCv, manualSteps.passport, crmItems.length >= 5, manualSteps.ds160].filter(Boolean).length
const checklistPercentage = Math.round((checklistDone / CHECKLIST_TOTAL_TASKS) * 100)
const weeklyTarget = goalFor(profileIndustry, profileRole).perWeek
// Postulaciones movidas fuera de "guardadas" en los últimos 7 días (no el total histórico)
const applicationsThisWeek = crmItems.filter(i => i.status !== 'guardadas' && now - i.lastUpdated < 7 * 24 * 60 * 60 * 1000).length
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

// Postulaciones en "seguimiento" con 7 días o más sin respuesta: van en Tu Prioridad y en la insignia de Mi CRM
const pendingFollowUps = crmItems.filter(
  (i) => i.status === 'seguimiento' && (now - i.createdAt) / (1000 * 60 * 60 * 24) >= 7
).length

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
const activeJobFilters =
  [selectedSeason !== 'ALL', selectedJobState !== 'ALL', selectedJobSector !== 'ALL', onlyHiresAbroad, jobSortBy !== 'recent'].filter(Boolean).length
// Para la etiqueta "temporada actual" del filtro de Ofertas (ver nota junto a selectedSeason)
const isSummerNow = (() => { const m = new Date().getMonth(); return !(m >= 3 && m <= 8) })()

return (
  <div className="min-h-dvh bg-[#F4F6F8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
    <a
      href="#contenido"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-lg focus:bg-[#08131F] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
    >
      Saltar al contenido
    </a>

    {/* HEADER Y NAVEGACIÓN */}
    <header
      className={`bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-xs transition-transform duration-200 motion-reduce:transition-none ${headerHidden ? '-translate-y-full' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <LogoMark size={36} decorative className="shrink-0 rounded-xl shadow-sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">Juan Te Avisa</span>
                <span className="font-black text-[#b8860b] text-base sm:text-lg leading-tight">PRO</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">Sistema Operativo H2B</p>
            </div>
          </div>

          {/* BOTÓN Y ESTADO DE SESIÓN (EL PORTERO) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle />
            <UserMenu onEditProfile={() => setShowOnboarding(true)} />
          </div>
        </div>
        <nav aria-label="Secciones" className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-medium overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            data-tab="dashboard"
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'text-[#1a3a8f] dark:text-blue-300 font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent'
              }`}
          >
            <Briefcase className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            data-tab="jobs"
            aria-current={activeTab === 'jobs' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'jobs' ? 'text-[#1a3a8f] dark:text-blue-300 font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent'
              }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Ofertas ({catalogTotals.jobs})
          </button>
          <button
            onClick={() => setActiveTab('employers')}
            data-tab="employers"
            aria-current={activeTab === 'employers' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'employers' ? 'text-[#1a3a8f] dark:text-blue-300 font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent'
              }`}
          >
            <Building2 className="w-4 h-4 text-sky-600" />
            Empresas USCIS ({catalogTotals.employers})
          </button>
          <button
            onClick={() => setActiveTab('agencies')}
            data-tab="agencies"
            aria-current={activeTab === 'agencies' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'agencies' ? 'text-[#1a3a8f] dark:text-blue-300 font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent'
              }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Agencias DOL ({catalogTotals.agencies})
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            data-tab="crm"
            aria-current={activeTab === 'crm' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'crm' ? 'text-[#1a3a8f] dark:text-blue-300 font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent'
              }`}
          >
            <Send className="w-4 h-4" />
            Mi CRM
            {pendingFollowUps > 0 && (
              <span
                className="min-w-5 h-5 px-1.5 rounded-full bg-rose-600 text-white text-[11px] font-bold leading-5 text-center"
                aria-label={`${pendingFollowUps} seguimientos pendientes`}
              >
                {pendingFollowUps}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            data-tab="ai"
            aria-current={activeTab === 'ai' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'ai' ? 'text-[#1a3a8f] dark:text-blue-300 font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent'
              }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Asistentes IA
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            data-tab="checklist"
            aria-current={activeTab === 'checklist' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'checklist' ? 'text-[#1a3a8f] dark:text-blue-300 font-semibold border-b-2 border-[#f5c518]' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent'
              }`}
          >
            <Compass className="w-4 h-4" />
            Mi Mapa
          </button>
        </nav>
      </div>
    </header>

    {/* CONTENIDO PRINCIPAL */}
    <main
      id="contenido"
      ref={mainRef}
      tabIndex={-1}
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-6 space-y-6 outline-none"
    >

      {/* DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <InstallAppBanner />
          <PushPromptCard />
          <div className="bg-gradient-to-r from-[#091E3A] via-[#0F2B48] to-[#1A365D] rounded-2xl p-5 sm:p-6 md:p-8 text-white relative overflow-hidden shadow-md">
            <span className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3">
              📣 Ofertas oficiales del DOL, actualizadas a diario
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black mb-2 tracking-tight">
              ¡Bienvenido a tu Centro de Control H2B!
            </h1>
            {/* En celular se omite: el título y los pasos ya lo dicen, y así Tu Prioridad sube */}
            <p className="hidden sm:block text-slate-300 text-xs md:text-sm max-w-2xl mb-6 leading-relaxed">
              Encuentra ofertas H-2B oficiales, empresas con visas aprobadas por USCIS y agencias reguladas, y lleva el seguimiento de cada postulación.
            </p>
            {/* BARRA DE PROGRESO — BÚSCALAS / POSTULA / VIAJA */}
            <ol aria-label="Tu avance" className="flex items-start mt-4 sm:mt-0 mb-5 sm:mb-6 max-w-md">
              {(() => {
                const hasApplied = crmItems.some(i => i.status !== 'guardadas')
                const hasAccepted = crmItems.some(i => i.status === 'aceptado')
                const currentStep = hasAccepted ? 3 : hasApplied ? 2 : 1
                const steps = [
                  { n: 1, label: 'Búscalas', icon: Search },
                  { n: 2, label: 'Postula', icon: Send },
                  { n: 3, label: 'Viaja', icon: Plane },
                ]
                return steps.map((s, idx) => {
                  const done = s.n < currentStep
                  const active = s.n === currentStep
                  const Icon = done ? Check : s.icon
                  return (
                    <li
                      key={s.n}
                      aria-current={active ? 'step' : undefined}
                      className="flex items-start flex-1 last:flex-none"
                    >
                      <div className="flex flex-col items-center gap-2 w-16">
                        <div className="relative">
                          {active && (
                            <span className="absolute inset-0 rounded-full bg-[#f5c518]/40 motion-safe:animate-ping" aria-hidden="true" />
                          )}
                          <div
                            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                              done || active
                                ? 'bg-[#f5c518] text-[#0B2545]'
                                : 'bg-white/10 text-white/50 ring-1 ring-white/15'
                            } ${active ? 'ring-4 ring-[#f5c518]/30' : ''}`}
                          >
                            <Icon className="w-4 h-4" strokeWidth={2.5} />
                          </div>
                        </div>
                        <span className={`text-[11px] font-semibold ${done || active ? 'text-white' : 'text-white/50'}`}>
                          {s.label}
                        </span>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className="flex-1 h-1 mt-[18px] -mx-2 rounded-full bg-white/15 overflow-hidden" aria-hidden="true">
                          <div
                            className="h-full bg-[#f5c518] rounded-full transition-all duration-700 ease-out"
                            style={{ width: done ? '100%' : '0%' }}
                          />
                        </div>
                      )}
                    </li>
                  )
                })
              })()}
            </ol>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('jobs')}
                className="w-full sm:w-auto justify-center min-h-11 bg-[#f5c518] hover:bg-[#e0b30f] text-[#0B2545] font-bold text-sm sm:text-xs px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
              >
                <Search className="w-4 h-4" /> Explora las Vacantes
              </button>
            </div>
          </div>

          {/* TU PRIORIDAD — la única acción que más importa ahora mismo */}
          {!nextAction && crmLoading && (
            <div role="status" aria-label="Cargando tu prioridad" className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 motion-safe:animate-pulse">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-2.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/70" />
                </div>
              </div>
              <div className="h-11 sm:h-9 w-full sm:w-32 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
            </div>
          )}
          {nextAction && (
            <div className="bg-white dark:bg-slate-900 border-2 border-[#f5c518]/60 dark:border-[#f5c518]/40 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <nextAction.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">🎯 Tu prioridad</span>
                  <h2 className="text-base font-black text-slate-900 dark:text-white mt-0.5">{nextAction.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{nextAction.desc}</p>
                </div>
              </div>
              <button
                onClick={nextAction.onClick}
                className="w-full sm:w-auto min-h-11 sm:min-h-0 bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-sm sm:text-xs px-5 py-2.5 rounded-xl transition-all shrink-0 whitespace-nowrap"
              >
                {nextAction.buttonLabel}
              </button>
            </div>
          )}

          {/* Avance del Compromiso de PRO y, si falta poco, aviso de vencimiento */}
          <MembershipNotices userId={onboardingUserId} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {([
              { tab: 'jobs', label: 'Ofertas (DOL)', value: catalogTotals.jobs, loading: !catalogLoaded, note: 'Ofertas publicadas', noteClass: 'text-emerald-600 dark:text-emerald-400', icon: Briefcase, iconClass: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' },
              { tab: 'employers', label: 'Empresas USCIS', value: catalogTotals.employers, loading: !catalogLoaded, note: '● En el catálogo', noteClass: 'text-emerald-600 dark:text-emerald-400', icon: Building2, iconClass: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' },
              { tab: 'agencies', label: 'Agencias reguladas', value: catalogTotals.agencies, loading: !catalogLoaded, note: '● En el catálogo', noteClass: 'text-emerald-600 dark:text-emerald-400', icon: ShieldCheck, iconClass: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
              { tab: 'checklist', label: 'Tu Mapa H2B', value: `${checklistPercentage}%`, loading: false, note: checklistDone > 0 ? `${checklistDone} de ${CHECKLIST_TOTAL_TASKS} completados` : 'Sin iniciar', noteClass: 'text-indigo-600 dark:text-indigo-400', icon: Compass, iconClass: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
            ] as const).map(({ tab, label, value, loading, note, noteClass, icon: Icon, iconClass }) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); window.scrollTo({ top: 0 }) }}
                className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-3.5 sm:p-4 flex justify-between items-center gap-2 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
                  {loading ? (
                    <span className="block h-7 w-16 mt-1.5 rounded bg-slate-200 dark:bg-slate-800 motion-safe:animate-pulse" aria-label="Cargando" />
                  ) : (
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
                  )}
                  <p className={`text-xs sm:text-[10px] font-semibold mt-0.5 flex items-center gap-1 ${noteClass}`}>
                    {tab === 'jobs' && <TrendingUp className="w-3 h-3 shrink-0" />}
                    <span className="truncate">{note}</span>
                  </p>
                </div>
                <div className={`hidden sm:flex w-11 h-11 rounded-xl items-center justify-center shrink-0 ${iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Extraer Oferta con IA
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pega un enlace de seasonaljobs.dol.gov para importar la vacante a tu CRM.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={extractUrl}
                onChange={(e) => setExtractUrl(e.target.value)}
                placeholder="https://seasonaljobs.dol.gov/job-order/..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <JobsTab
          filteredJobs={filteredJobs}
          isLoading={isLoading}
          totalJobsCount={totalJobsCount}
          totalJobPages={totalJobPages}
          jobPage={jobPage}
          setJobPage={setJobPage}
          jobSearch={jobSearch}
          setJobSearch={setJobSearch}
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
          selectedJobState={selectedJobState}
          setSelectedJobState={setSelectedJobState}
          selectedJobSector={selectedJobSector}
          setSelectedJobSector={setSelectedJobSector}
          onlyHiresAbroad={onlyHiresAbroad}
          setOnlyHiresAbroad={setOnlyHiresAbroad}
          jobSortBy={jobSortBy}
          setJobSortBy={setJobSortBy}
          sponsorFilter={sponsorFilter}
          setSponsorFilter={setSponsorFilter}
          jobFiltersOpen={jobFiltersOpen}
          setJobFiltersOpen={setJobFiltersOpen}
          activeJobFilters={activeJobFilters}
          isSummerNow={isSummerNow}
          profileCompleted={profileCompleted}
          matchScores={matchScores}
          crmItems={crmItems}
          savingCrmKey={savingCrmKey}
          addToCRM={addToCRM}
          setSelectedJob={setSelectedJob}
        />
      )}

      {/* TABLA 2: EMPRESAS USCIS (employers) */}
      {activeTab === 'employers' && (
        <EmployersTab
          employers={employers}
          isLoading={isLoading}
          totalEmployersCount={totalEmployersCount}
          totalCompanyPages={totalCompanyPages}
          companyPage={companyPage}
          setCompanyPage={setCompanyPage}
          companySearch={companySearch}
          setCompanySearch={setCompanySearch}
          selectedCompanyState={selectedCompanyState}
          setSelectedCompanyState={setSelectedCompanyState}
          selectedCompanySector={selectedCompanySector}
          setSelectedCompanySector={setSelectedCompanySector}
          selectedCapType={selectedCapType}
          setSelectedCapType={setSelectedCapType}
          viewJobsFor={viewJobsFor}
        />
      )}

      {/* TABLA 3: AGENCIAS DOL (sponsor_agencies) */}
      {activeTab === 'agencies' && (
        <AgenciesTab
          agencies={agencies}
          isLoading={isLoading}
          totalAgenciesCount={totalAgenciesCount}
          totalAgencyPages={totalAgencyPages}
          agencyPage={agencyPage}
          setAgencyPage={setAgencyPage}
          agencySearch={agencySearch}
          setAgencySearch={setAgencySearch}
          selectedAgencyCountry={selectedAgencyCountry}
          setSelectedAgencyCountry={setSelectedAgencyCountry}
        />
      )}

      {/* MI CRM — CENTRO DE COMANDO KANBAN */}
      {activeTab === 'crm' && (
        <CrmTab
          crmItems={crmItems}
          crmError={crmError}
          crmLoading={crmLoading}
          applicationsThisWeek={applicationsThisWeek}
          weeklyTarget={weeklyTarget}
          searchHealthPercentage={searchHealthPercentage}
          pendingFollowUps={pendingFollowUps}
          changeCrmStatus={changeCrmStatus}
          deleteCrmItem={deleteCrmItem}
          daysSinceApplied={daysSinceApplied}
          markFollowupSent={markFollowupSent}
          openEmailFor={openEmailFor}
          renderReplyControl={renderReplyControl}
          saveNotes={saveNotes}
          editingNotesId={editingNotesId}
          setEditingNotesId={setEditingNotesId}
          tempNotes={tempNotes}
          setTempNotes={setTempNotes}
          setIsManualModalOpen={setIsManualModalOpen}
          setShowInterviewSimulator={setShowInterviewSimulator}
          setSimulatorJob={setSimulatorJob}
          goToJobs={() => setActiveTab('jobs')}
        />
      )}

      {/* TAB 5: ASISTENTES IA */}
      {activeTab === 'ai' && (
        <AiToolsTab
          hasCv={hasCv}
          setShowCvBuilder={setShowCvBuilder}
          setShowEmailAssistant={setShowEmailAssistant}
          setShowInterviewSimulator={setShowInterviewSimulator}
          setShowScamDetector={setShowScamDetector}
        />
      )}

     {/* TAB CHECKLIST EN app/page.tsx */}
{activeTab === 'checklist' && (
  <H2BMap
    userId={onboardingUserId}
    hasCv={hasCv}
    perfilCompletado={profileCompleted}
    crmItems={crmItems.map((i) => ({ status: i.status, createdAt: i.createdAt }))}
    onEditProfile={() => setShowOnboarding(true)}
    onOpenCvBuilder={() => setShowCvBuilder(true)}
    onNavigateToTab={(tab) => {
      if ((TABS as string[]).includes(tab)) setActiveTab(tab as Tab)
    }}
    onOpenInterview={() => setShowInterviewSimulator(true)}
    onOpenScamDetector={() => setShowScamDetector(true)}
    onSaveOffer={(company, role, state) => addToCRM(company, role, state)}
    onOpenJob={async (jobId) => {
      const { data } = await supabase
        .from('jobs')
        .select('*, sponsor:sponsor_companies(employer_name, consular_processed, total_approved, cap_type)')
        .eq('id', jobId)
        .maybeSingle()
      if (data) setSelectedJob(data)
    }}
  />
)}
      {/* MODAL DETALLE DE OFERTA LABORAL (ÚNICO) */}
      {selectedJob && (
        <JobDetailModal
          selectedJob={selectedJob}
          setSelectedJob={setSelectedJob}
          crmItems={crmItems}
          addToCRM={addToCRM}
          setApplyFlowJob={setApplyFlowJob}
        />
      )}
    </main>

    <PullToRefresh />
    <MobileTabBar
      activeTab={activeTab}
      badges={{ crm: pendingFollowUps }}
      onChange={(tab) => {
        setActiveTab(tab as Tab)
        window.scrollTo({ top: 0 })
      }}
    />
    {/* MODAL DE POSTULACIÓN MANUAL */}
    {isManualModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">

          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 flex justify-between items-center px-6 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Agregar Postulación Manual</h3>
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              aria-label="Cerrar"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 text-base font-bold"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveManualItem} className="space-y-4 px-6 pb-6 pt-4">
            <div>
              <label htmlFor="manual-company" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Empresa *</label>
              <input
                id="manual-company"
                type="text"
                required
                placeholder="Ej: Agro S.A."
                value={manualCompany}
                onChange={(e) => setManualCompany(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="manual-role" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Puesto / Vacante</label>
              <input
                id="manual-role"
                type="text"
                placeholder="Ej: Operador Agrícola H2B"
                value={manualRole}
                onChange={(e) => setManualRole(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="manual-state" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Estado / Ubicación</label>
              <input
                id="manual-state"
                type="text"
                placeholder="Ej: TX o Texas"
                value={manualState}
                onChange={(e) => setManualState(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="manual-status" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Estado de la Postulación</label>
              <select
                id="manual-status"
                value={manualStatus}
                onChange={(e) => setManualStatus(e.target.value as CRMItem['status'])}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
              >
                <option value="guardadas">Guardadas</option>
                <option value="postulado">Postulado</option>
                <option value="seguimiento">Seguimiento (7-14-21)</option>
                <option value="entrevista">Entrevista</option>
                <option value="aceptado">Aceptado</option>
                <option value="no_respondido">No respondido / Rechazado</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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

    <AssistantModal
      isOpen={showEmailAssistant && !showCvBuilder}
      label="Redactor de correos"
      onClose={() => {
        setShowEmailAssistant(false)
        setEmailDraftFor(null)
      }}
    >
      <EmailAssistantTab
        key={`${emailDraftFor?.company || ''}-${emailDraftFor?.role || ''}-${emailDraftFor?.type || ''}`}
        userId={onboardingUserId}
        initialCompanyName={emailDraftFor?.company || ''}
        initialJobTitle={emailDraftFor?.role || ''}
        initialEmailType={emailDraftFor?.type || 'initial'}
        onMoveToInterview={async (company, role) => {
          const item = crmItems.find((i) => crmKey(i.company, i.role) === crmKey(company, role))
          if (!item) {
            showToast('No encontramos esa postulación en tu CRM.')
            return false
          }
          await changeCrmStatus(item.id, 'entrevista')
          return true
        }}
        onFollowupSent={async (company, role, type) => {
          const item = crmItems.find((i) => crmKey(i.company, i.role) === crmKey(company, role))
          if (!item) {
            showToast('No encontramos esa postulación en tu CRM.')
            return false
          }
          return markFollowupSent(item, type === 'followup_7d' ? 1 : 2)
        }}
        savedOffers={crmItems.map(i => ({ company: i.company, role: i.role, state: i.state, status: i.status }))}
        onOpenCvBuilder={() => setShowCvBuilder(true)}
      />
    </AssistantModal>

    <AssistantModal isOpen={showScamDetector} label="Detector de estafas" onClose={() => setShowScamDetector(false)}>
      <ScamDetectorTab />
    </AssistantModal>

    <AssistantModal
      isOpen={showInterviewSimulator && !showCvBuilder}
      label="Simulador de entrevista"
      onClose={() => {
        setShowInterviewSimulator(false)
        setSimulatorJob(null)
      }}
    >
      <InterviewSimulatorTab key={`${simulatorJob?.company || ''}-${simulatorJob?.role || ''}`} initialJob={simulatorJob} userId={onboardingUserId} onOpenCvBuilder={() => setShowCvBuilder(true)} savedOffers={crmItems.map((i) => ({ company: i.company, role: i.role, status: i.status }))} />
    </AssistantModal>

    <CVBuilderModal
      isOpen={showCvBuilder}
      userId={onboardingUserId}
      job={cvJob}
      onClose={() => {
        setShowCvBuilder(false)
        setCvJob(null)
      }}
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
      onAdaptCv={() => {
        if (!applyFlowJob) return
        setCvJob({
          title: applyFlowJob.title,
          employerName: applyFlowJob.employerName,
          location: applyFlowJob.location,
          duties: applyFlowJob.duties,
        })
        setShowCvBuilder(true)
      }}
      onApplied={() => applyFlowJob && applyJobToCrm(applyFlowJob)}
    />

    {toastMessage && (
      <div
        role="status"
        aria-live="polite"
        className="fixed z-[100] left-4 right-4 sm:left-auto sm:right-6 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-6 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-center sm:text-left animate-in fade-in slide-in-from-bottom-4"
      >
        {toastMessage}
      </div>
    )}
  </div>
);
}
