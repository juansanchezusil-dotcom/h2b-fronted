// Metas de postulaciones. Dos cosas distintas:
//  - COMMITMENT_FLOOR: el mínimo del Compromiso de PRO (un solo número para todos, en 30 días).
//  - goalFor(): la meta recomendada según el puesto o la industria. Es una guía, no una condición.
// Mismo piso en el backend: src/admin/radar.ts (RADAR.goal). Si se cambia allá, cambiarlo aquí también.

export const COMMITMENT_FLOOR = 40

export type GoalTier = 'alto' | 'medio' | 'clientes'

export interface Goal {
  tier: GoalTier
  perWeek: number
  perMonth: number
  label: string
}

const TIERS: Record<GoalTier, { perWeek: number; label: string }> = {
  alto: { perWeek: 20, label: 'puestos de volumen' },
  medio: { perWeek: 12, label: 'puestos generales' },
  clientes: { perWeek: 10, label: 'puestos con trato al cliente' },
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Orden importa: primero trato con clientes, luego volumen; lo demás es medio
const CLIENTES = /front ?desk|recepci|mesero|server|waiter|bartend|barman|bar tender|botones|bell ?(man|boy|hop)|concierge|hostess|\bhost\b/
const ALTO = /cocin|cook|chef|line cook|housekeep|limpie|clean|maid|camarer|landscap|jardin|constru|electric|carpint|carpent|pintor|paint|roof|techo|plomer|labor/

export function goalFor(industry?: string | null, role?: string | null): Goal {
  const text = normalize(`${role || ''} ${industry || ''}`)
  const tier: GoalTier = CLIENTES.test(text) ? 'clientes' : ALTO.test(text) ? 'alto' : 'medio'
  const { perWeek, label } = TIERS[tier]
  return { tier, perWeek, perMonth: perWeek * 4, label }
}
