// Mi Mapa H2B: arma el mapa personal de cada persona a partir de sus datos reales (perfil, CV, CRM,
// avance del Compromiso). Función pura, sin base ni navegador, para poder probarla. Los textos no
// prometen visa, patrocinio, entrevista ni empleo: describen dónde está la persona y qué sigue.

import { goalFor, type Goal } from './goals'
const DAY = 24 * 60 * 60 * 1000

export type StageId = 'prepare' | 'search' | 'apply' | 'followup' | 'interview'
export type RouteCode = '' | 'A' | 'B' | 'C'
export type StepAction = 'profile' | 'cv' | 'jobs' | 'crm' | 'interview' | 'passport' | 'scam'

export interface MapInput {
  profile: {
    targetRole: string
    industry: string
    englishLevel: string
    country: string
    cvRoute: RouteCode
    perfilCompletado: boolean
  }
  hasCv: boolean
  crm: { status: string; createdAt: number }[]
  steps: { passport: boolean; ds160: boolean }
  // Del Compromiso de PRO (hook de avisos): día N de 30 y empresas distintas postuladas en 30 días
  dia: number | null
  applied30: number
  now: number
}

export interface Stage {
  id: StageId
  label: string
  state: 'done' | 'current' | 'next'
}

export interface NextStep {
  id: string
  title: string
  desc: string
  action: StepAction
  buttonLabel: string
}

export interface PlanItem {
  label: string
  done: boolean
}

export interface PlanWeek {
  week: number
  title: string
  current: boolean
  items: PlanItem[]
}

export interface H2BMapData {
  stages: Stage[]
  currentStage: StageId
  headline: string
  route: { code: RouteCode; label: string; explanation: string } | null
  englishNote: string | null
  nextSteps: NextStep[]
  plan: PlanWeek[]
  goal: Goal
  stats: { guardadas: number; postuladas: number; seguimiento: number; entrevistas: number; aceptadas: number }
  progress: { done: number; total: number }
}

const STAGES: { id: StageId; label: string }[] = [
  { id: 'prepare', label: 'Prepárate' },
  { id: 'search', label: 'Búscalas' },
  { id: 'apply', label: 'Postula' },
  { id: 'followup', label: 'Seguimiento' },
  { id: 'interview', label: 'Entrevista' },
]

const HEADLINES: Record<StageId, string> = {
  prepare: 'Estás en Prepárate: te falta completar tu perfil o tu CV para postular con una base sólida.',
  search: 'Estás en Búscalas: ya estás listo para buscar ofertas verificadas y guardar las que encajan contigo.',
  apply: 'Estás en Postula: toca enviar tus postulaciones a empresas distintas.',
  followup: 'Estás en Seguimiento: tienes postulaciones enviadas que necesitan un mensaje de seguimiento.',
  interview: 'Estás en Entrevista: ya hay movimiento real en tu búsqueda. Prepárate para responder con calma.',
}

const ROUTES: Record<'A' | 'B' | 'C', { label: string; explanation: string }> = {
  A: {
    label: 'Experiencia directa',
    explanation: 'Ya hiciste este trabajo. Tu CV destaca tareas concretas, herramientas y lo que lograste.',
  },
  B: {
    label: 'Experiencia transferible',
    explanation: 'Tu experiencia se relaciona con este puesto. Tu CV conecta lo que sabes hacer con lo que piden.',
  },
  C: {
    label: 'Experiencia práctica',
    explanation: 'Tu experiencia es práctica o informal. Tu CV muestra lo que sí has hecho, sin presentarlo como un empleo formal.',
  },
}

// Puestos que suelen exigir inglés avanzado o fluido (atención directa a clientes o huéspedes).
// Mantener sincronizado con el backend: src/ai/cv/industryBanks.ts (englishDemand: 'high').
const HIGH_ENGLISH: { re: RegExp; label: string }[] = [
  { re: /barman|bartend|cantiner|mixolog/i, label: 'Barman' },
  { re: /\bserver\b|waiter|waitress|mesero|mesera|hostess|banquet/i, label: 'Mesero' },
  { re: /front desk|frontdesk|reception|recepci[oó]n|recepcionista|hotel clerk|concierge/i, label: 'Front desk' },
  { re: /bell ?(hop|man|boy|attendant|staff)|botones|\bporter\b|maletero/i, label: 'Botones' },
]

const isAdvancedEnglish = (level: string) => /avanz|fluid|fluent|advanced|nativ|native/i.test(level)

export function englishNoteFor(targetRole: string, industry: string, englishLevel: string): string | null {
  const text = `${targetRole} ${industry}`
  const match = HIGH_ENGLISH.find((h) => h.re.test(text))
  if (!match || isAdvancedEnglish(englishLevel)) return null
  const declared = englishLevel.trim().toLowerCase()
  return declared
    ? `Los puestos de ${match.label} suelen exigir inglés avanzado o fluido, y tú indicaste inglés ${declared}. Es probable que la entrevista sea en inglés: practica con el Simulador de Entrevista.`
    : `Los puestos de ${match.label} suelen exigir inglés avanzado o fluido. Confirma tu nivel real y practica con el Simulador de Entrevista.`
}

export function buildMap(input: MapInput): H2BMapData {
  const { profile, hasCv, crm, steps, now } = input
  const goal = goalFor(profile.industry, profile.targetRole)
  const MAP_GOAL = goal.perMonth
  const part = (pct: number) => Math.max(5, Math.round((MAP_GOAL * pct) / 100))

  const count = (status: string) => crm.filter((i) => i.status === status).length
  const guardadas = count('guardadas')
  const applied = crm.length - guardadas
  const seguimiento = count('seguimiento')
  const entrevistas = count('entrevista')
  const aceptadas = count('aceptado')
  // Mismo criterio que "Tu prioridad": en seguimiento desde hace 7 días o más
  const pendingFollowUps = crm.filter((i) => i.status === 'seguimiento' && (now - i.createdAt) / DAY >= 7).length

  const prepared = profile.perfilCompletado && hasCv

  // Dónde debe estar el foco de la persona ahora
  let currentStage: StageId
  if (entrevistas > 0 || aceptadas > 0) currentStage = 'interview'
  else if (applied >= 5 && pendingFollowUps > 0) currentStage = 'followup'
  else if (applied >= 1 || guardadas >= 1) currentStage = prepared || applied >= 1 ? 'apply' : 'prepare'
  else currentStage = prepared ? 'search' : 'prepare'

  const currentIndex = STAGES.findIndex((s) => s.id === currentStage)
  const stages: Stage[] = STAGES.map((s, i) => ({
    ...s,
    state: i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'next',
  }))

  const route =
    hasCv && (profile.cvRoute === 'A' || profile.cvRoute === 'B' || profile.cvRoute === 'C')
      ? { code: profile.cvRoute, ...ROUTES[profile.cvRoute] }
      : null

  const englishNote = englishNoteFor(profile.targetRole, profile.industry, profile.englishLevel)

  // Próximos pasos: los 3 más importantes que todavía no están hechos, en orden de prioridad
  const candidates: (NextStep | false)[] = [
    !profile.perfilCompletado && {
      id: 'profile',
      title: 'Completa tu perfil',
      desc: 'Con tu experiencia, inglés y país calculamos qué tan bien encajas con cada oferta.',
      action: 'profile',
      buttonLabel: 'Completar perfil',
    },
    !hasCv && {
      id: 'cv',
      title: 'Genera tu CV en inglés',
      desc: 'Lo necesitas para postular, y el redactor de correos lo usa para personalizar tus mensajes.',
      action: 'cv',
      buttonLabel: 'Generar mi CV',
    },
    crm.length === 0 && {
      id: 'save',
      title: 'Guarda tus primeras ofertas',
      desc: 'Busca vacantes de tu rubro, revisa que la empresa sea verificada y guarda las que encajan.',
      action: 'jobs',
      buttonLabel: 'Ver ofertas',
    },
    applied === 0 && guardadas > 0 && {
      id: 'apply-first',
      title: guardadas === 1 ? 'Postula a tu oferta guardada' : `Postula a tus ${guardadas} ofertas guardadas`,
      desc: 'Guardarlas es el primer paso. Escríbele a la empresa para que el proceso avance.',
      action: 'crm',
      buttonLabel: 'Ir a Mi CRM',
    },
    pendingFollowUps > 0 && {
      id: 'followup',
      title: pendingFollowUps === 1 ? 'Da seguimiento a 1 postulación' : `Da seguimiento a ${pendingFollowUps} postulaciones`,
      desc: 'Estas empresas no han respondido. Escríbeles para reconfirmar tu interés.',
      action: 'crm',
      buttonLabel: 'Ir a Mi CRM',
    },
    entrevistas > 0 && {
      id: 'interview',
      title: 'Practica tu entrevista',
      desc: 'Ensaya las preguntas típicas en inglés y recibe feedback en español antes de la entrevista real.',
      action: 'interview',
      buttonLabel: 'Practicar',
    },
    prepared && input.applied30 < MAP_GOAL && applied > 0 && {
      id: 'goal',
      title: `Te faltan ${MAP_GOAL - input.applied30} postulaciones para tu meta de 30 días`,
      desc: `Llevas ${input.applied30} de ${MAP_GOAL} postulaciones a empresas distintas.`,
      action: 'jobs',
      buttonLabel: 'Ver ofertas',
    },
    englishNote !== null && {
      id: 'english',
      title: 'Refuerza tu inglés para tu puesto',
      desc: 'Tu puesto suele pedir inglés avanzado o fluido. Practica con el Simulador de Entrevista.',
      action: 'interview',
      buttonLabel: 'Practicar inglés',
    },
    !steps.passport && {
      id: 'passport',
      title: 'Confirma la vigencia de tu pasaporte',
      desc: 'Debe tener al menos 6 meses de vigencia a partir del inicio de la temporada.',
      action: 'passport',
      buttonLabel: 'Marcar como listo',
    },
  ]
  const nextSteps = candidates.filter((c): c is NextStep => c !== false).slice(0, 3)

  // Plan de 30 días, con lo que ya está hecho marcado según los datos reales
  const week = input.dia === null ? null : Math.min(4, Math.ceil(input.dia / 7))
  const plan: PlanWeek[] = [
    {
      week: 1,
      title: 'Prepárate',
      current: week === 1,
      items: [
        { label: 'Perfil completo', done: profile.perfilCompletado },
        { label: 'CV en inglés generado', done: hasCv },
        { label: 'Pasaporte con vigencia confirmada', done: steps.passport },
        { label: 'Guardar 5 ofertas de tu rubro', done: crm.length >= 5 },
      ],
    },
    {
      week: 2,
      title: 'Primeras postulaciones',
      current: week === 2,
      items: [{ label: `${part(30)} postulaciones a empresas distintas`, done: input.applied30 >= part(30) }],
    },
    {
      week: 3,
      title: 'Seguimiento',
      current: week === 3,
      items: [
        { label: 'Seguimiento a las postulaciones de 7 días', done: applied > 0 && pendingFollowUps === 0 },
        { label: `${part(70)} postulaciones a empresas distintas`, done: input.applied30 >= part(70) },
      ],
    },
    {
      week: 4,
      title: 'Revisa y ajusta',
      current: week === 4,
      items: [
        { label: `Llegar a ${MAP_GOAL} postulaciones a empresas distintas`, done: input.applied30 >= MAP_GOAL },
        { label: 'Revisar qué empresas respondieron', done: entrevistas + aceptadas + count('rechazada') > 0 },
        { label: 'Ajustar tu CV o tus ofertas según lo que veas', done: false },
      ],
    },
  ]

  // Progreso general: los mismos 5 elementos del panel anterior (perfil, CV, pasaporte, 5 ofertas y DS-160)
  const checks = [profile.perfilCompletado, hasCv, steps.passport, crm.length >= 5, steps.ds160]
  return {
    stages,
    currentStage,
    headline: HEADLINES[currentStage],
    route,
    englishNote,
    nextSteps,
    plan,
    goal,
    stats: { guardadas, postuladas: applied, seguimiento, entrevistas, aceptadas },
    progress: { done: checks.filter(Boolean).length, total: checks.length },
  }
}
