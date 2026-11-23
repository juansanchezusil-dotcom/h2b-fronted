// Dos CV por persona: uno por ruta. El de la Ruta A (la de mayor experiencia, la postulación principal) vive en las
// columnas de siempre de profiles (base_cv_text, skills, target_role...). El de la Ruta B (secundaria) vive en
// profiles.cv_b: { target_role, base_cv_text, skills, cv_en, cv_draft, cover_letter_en, route, updated_at }.
// Mantener sincronizado con el backend: src/jobs/roleMatch.ts (familias de puestos).

export type CvSlot = 'A' | 'B'

export type CvBData = {
  target_role?: string
  base_cv_text?: string
  skills?: string[]
  cv_en?: unknown
  cv_draft?: unknown
  cover_letter_en?: string
  route?: string
  updated_at?: string
} | null

export interface RouteProfileRow {
  target_role?: string | null
  industry?: string | null
  experiencia_industria?: string | null
  experiencia_industria_b?: string | null
  base_cv_text?: string | null
  skills?: string[] | null
  cv_b?: CvBData
}

export const hasCvText = (t?: string | null) => (t || '').trim().length >= 30

const FAMILIES: [string, RegExp][] = [
  ['limpieza', /housekeep|room attend|maid|cleaner|janitor|camarer|limpie|aseo|laundry|lavander/],
  ['cocina', /cook|chef|kitchen|cocin|dishwash|lavaplat|prep|baker|panader|food/],
  ['jardin', /landscap|ground|garden|jardin|lawn|paisaj|nursery|farm|agricult|vivero/],
  ['construccion', /construct|construcc|laborer|carpent|carpint|mason|roof|concrete|drywall|paint|pintor|alba[nñ]il|obra|builder|rigger|electric|plumb|weld|maintenance|mantenim/],
  ['recepcion', /front desk|reception|recepci|concierge|bell|botones|hotel clerk/],
  ['servicio', /server|waiter|waitress|mesero|mesera|bartend|barman|host|busser/],
  ['conduccion', /driver|conduct|chofer|truck/],
  ['almacen', /warehouse|almac|packer|packing|stock|forklift|procesad|production|assembly/],
]

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function familiesOf(text: string): Set<string> {
  const t = norm(text)
  return new Set(FAMILIES.filter(([, re]) => re.test(t)).map(([id]) => id))
}

function matches(jobTitle: string, want: string): boolean {
  const w = (want || '').trim()
  if (!jobTitle || !w || w === 'Sin Experiencia') return false
  const jf = familiesOf(jobTitle)
  const wf = familiesOf(w)
  for (const f of jf) if (wf.has(f)) return true
  if (wf.size === 0 || jf.size === 0) {
    const words = (s: string) => new Set(norm(s).split(/[^a-z0-9]+/).filter((x) => x.length >= 4))
    const a = words(jobTitle)
    for (const x of words(w)) if (a.has(x)) return true
  }
  return false
}

// 'A' si la oferta es de su ruta principal, 'B' si es de la secundaria, null si no es de ninguna.
export function routeOfJob(jobTitle: string, p: RouteProfileRow | null | undefined): CvSlot | null {
  if (!p) return null
  if ([p.target_role, p.industry, p.experiencia_industria].some((w) => matches(jobTitle, w || ''))) return 'A'
  if (matches(jobTitle, p.experiencia_industria_b || '')) return 'B'
  return null
}

// Con qué CV se postula a esta oferta: el de la B solo si la oferta es de la B; en cualquier otro caso, el de la A.
export function slotForJob(jobTitle: string, p: RouteProfileRow | null | undefined): CvSlot {
  return routeOfJob(jobTitle, p) === 'B' ? 'B' : 'A'
}

export function cvTextOf(p: RouteProfileRow | null | undefined, slot: CvSlot): string {
  if (!p) return ''
  return (slot === 'B' ? p.cv_b?.base_cv_text : p.base_cv_text) || ''
}

export function skillsOf(p: RouteProfileRow | null | undefined, slot: CvSlot): string[] {
  const s = slot === 'B' ? p?.cv_b?.skills : p?.skills
  return Array.isArray(s) ? s : []
}
