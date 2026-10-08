// Cálculo de los avisos para el miembro (avance del Compromiso de PRO y vencimiento). Función pura:
// no toca la base ni el navegador, para poder probarla.

// Mismos números que usa el radar del administrador (backend: src/admin/radar.ts, constante RADAR).
// Si se cambian allá, cambiarlos aquí también.
export const COMMITMENT_DAYS = 30
export { COMMITMENT_FLOOR as COMMITMENT_GOAL } from './goals'
export const RENEWAL_NOTICE_DAYS = 7

const DAY = 24 * 60 * 60 * 1000

export interface Notices {
  dia: number | null // día del Compromiso (1 a 30), null si no hay fecha de alta
  postulaciones: number // empresas distintas que entraron al proceso en los últimos 30 días
  venceEn: number | null // días para que venza el acceso (negativo si ya venció)
  venceFecha: string | null
  mostrarRenovacion: boolean
}

export interface EventoPostulacion {
  company_name: string
  from_status: string | null
  to_status: string
  created_at: string
}

export function computeNotices(
  acceso: { created_at: string | null; vence_el: string | null } | null,
  eventos: EventoPostulacion[],
  now: number
): Notices {
  const windowStart = now - COMMITMENT_DAYS * DAY

  // Una postulación = una empresa que salió de "guardadas" (o se creó ya postulada), en la ventana de 30 días
  const empresas = new Set<string>()
  for (const e of eventos) {
    const t = new Date(e.created_at).getTime()
    if (!Number.isFinite(t) || t < windowStart) continue
    if (e.to_status !== 'guardadas' && (e.from_status === null || e.from_status === 'guardadas')) empresas.add(e.company_name)
  }

  const alta = acceso?.created_at ? new Date(acceso.created_at).getTime() : null
  const vence = acceso?.vence_el ? new Date(acceso.vence_el).getTime() : null
  const venceEn = vence === null ? null : Math.ceil((vence - now) / DAY)

  return {
    dia: alta === null ? null : Math.min(Math.floor((now - alta) / DAY) + 1, COMMITMENT_DAYS),
    postulaciones: empresas.size,
    venceEn,
    venceFecha: vence === null ? null : new Date(vence).toLocaleDateString('es', { day: 'numeric', month: 'long' }),
    // Solo cuando faltan 7 días o menos (o es hoy); nunca para quien no tiene fecha de vencimiento
    mostrarRenovacion: venceEn !== null && venceEn >= 0 && venceEn <= RENEWAL_NOTICE_DAYS,
  }
}
