// Tipos y datos compartidos de la app H-2B (antes vivían todos en app/page.tsx)
import type { SponsorData, SponsorMatch } from '@/components/SponsorHistory'

// LISTA COMPLETA DE ESTADOS DE EE. UU. Y TERRITORIOS
export const US_STATES = [
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

// Interfaces ajustadas a la BBDD real
export interface Job {
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
  // Nombres alternativos de las mismas columnas según la fuente (scraper del DOL, CareerOneStop, carga manual)
  case_number?: string
  job_title?: string
  emp_name?: string
  employer?: string
  start_date?: string
  fecha_inicio?: string
  fecha_fin?: string
  pay_rate?: string
  workers_needed?: number | string
  vacantes?: number | string
  jornada?: string
  phone?: string
  phone_to_apply?: string
  recruitment_phone?: string
  email?: string
  emp_email?: string
  recruitment_email?: string
  description?: string
  duties?: string
  job_duties?: string
  source?: string
  created_at?: string
  // Historial de la empresa en USCIS (ver SponsorHistory)
  sponsor?: SponsorData | null
  sponsor_match?: SponsorMatch
}

export interface SponsorCompany {
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
}

// Lista oficial del DOL de reclutadores/agentes extranjeros declarados para H-2B
// (transparencia contra fraude, no un directorio de servicios). La tabla real
// solo trae estas columnas — no hay correo, sitio "oficial" alterno ni estado,
// aunque el nombre sugiera lo contrario.
export interface SponsorAgency {
  id?: string | number
  agency_name?: string
  city?: string
  country?: string
  case_count?: number
  website?: string
}

// ===== CRM: Centro de Comando Kanban expandido =====
export interface CRMItem {
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
  // Cuándo envió su primer y su segundo seguimiento (los registra la persona)
  followup1At?: number | null
  followup2At?: number | null
  // Respuesta del empleador que la persona registró (más datos, entrevista, rechazo u otra)
  replyType?: 'mas_datos' | 'entrevista' | 'rechazo' | 'otra' | null
  replyAt?: number | null
}

export const REPLY_LABELS: Record<'mas_datos' | 'entrevista' | 'rechazo' | 'otra', string> = {
  mas_datos: 'Pidió más datos o documentos',
  entrevista: 'Me invitó a entrevista',
  rechazo: 'Me dijo que no por ahora',
  otra: 'Otra respuesta',
}

// Cada oferta viene del scraper diario del DOL o de la carga de CareerOneStop (columna "source")
export const sourceInfo = (source?: string) =>
  source === 'CareerOneStop'
    ? {
        label: 'CareerOneStop',
        tooltip: 'Oferta H-2B publicada en CareerOneStop, el portal de empleo del Departamento de Trabajo de EE. UU. La revisamos y la reunimos aquí junto a las demás para que no tengas que buscar en varios sitios.',
      }
    : {
        label: 'DOL',
        tooltip: 'Oferta con certificación laboral H-2B del Departamento de Trabajo de EE. UU. (DOL). La tomamos del registro oficial cada día y la reunimos aquí con sus datos de contacto para que postules directo.',
      }

// El scraper guarda el salario como "$21.12 / hour"; se separa para destacar el monto
export const WAGE_UNITS: Record<string, string> = { hour: 'hora', week: 'semana', month: 'mes', year: 'año' }
export const splitWage = (wage?: string | null) => {
  if (!wage) return null
  const [amount, unit] = wage.split('/').map(s => s.trim())
  return { amount, unit: unit ? WAGE_UNITS[unit.toLowerCase()] || unit : '' }
}

// Lo que necesita el flujo de postulación (ApplyFlowModal) de una oferta
export interface ApplyFlowJob {
  title: string
  employerName: string
  location?: string
  contactEmail?: string
  duties?: string
  reference?: string
}

export const labelForStatus = (status: string) => {
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

// Clave para reconocer la misma postulación aunque cambien mayúsculas o espacios
export const crmKey = (company: string, role: string) => `${company}|${role}`.trim().toLowerCase()

// Columnas del tablero de Mi CRM (la última junta "no respondido" y "rechazada")
export type CrmColumn = 'guardadas' | 'postulado' | 'seguimiento' | 'entrevista' | 'aceptado' | 'cerradas'
export const CRM_COLUMNS: { id: CrmColumn; label: string }[] = [
  { id: 'guardadas', label: 'Guardadas' },
  { id: 'postulado', label: 'Postulado' },
  { id: 'seguimiento', label: 'Seguimiento' },
  { id: 'entrevista', label: 'Entrevista' },
  { id: 'aceptado', label: 'Aceptado' },
  { id: 'cerradas', label: 'Cerradas' },
]
export const crmColumnOf = (status: CRMItem['status']): CrmColumn =>
  status === 'no_respondido' || status === 'rechazada' ? 'cerradas' : status
