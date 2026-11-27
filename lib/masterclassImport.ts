import { crmKey } from '@/lib/h2b'

// El dashboard de la masterclass (public/masterclass.html) guarda las ofertas solo en el navegador. Como se sirve
// desde el mismo dominio que la app, la app puede leerlas y pasarlas al CRM de la cuenta, para que no se pierdan
// al cambiar de celular.
export const MASTERCLASS_KEY = 'jta-dashboard-h2b-v4'
// Ids de las ofertas de la masterclass que ya se pasaron (o que la persona decidió no pasar)
export const IMPORTED_KEY = 'jta-masterclass-importadas'

export type MasterclassOffer = {
  id: string
  puesto?: string
  empresa?: string
  url?: string
  estado?: string
}

export type ImportRow = {
  sourceId: string
  company_name: string
  job_title: string
  status: 'guardadas' | 'postulado' | 'seguimiento' | 'entrevista'
  notes: string
}

const STATUS: Record<string, ImportRow['status']> = {
  guardada: 'guardadas',
  postulada: 'postulado',
  seguimiento: 'seguimiento',
  entrevista: 'entrevista',
}

export function readMasterclassOffers(raw: string | null): MasterclassOffer[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    const offers = data && Array.isArray(data.offers) ? data.offers : []
    return offers.filter((o: unknown): o is MasterclassOffer =>
      !!o && typeof o === 'object' && typeof (o as MasterclassOffer).id === 'string')
  } catch {
    return []
  }
}

export function readImportedIds(raw: string | null): Set<string> {
  if (!raw) return new Set()
  try {
    const ids = JSON.parse(raw)
    return new Set(Array.isArray(ids) ? ids.filter((x) => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

// Ofertas de la masterclass que aún no están en el CRM. Las descartadas y las que no tienen empresa no se pasan;
// las que ya están en el CRM (misma empresa y puesto) tampoco.
export function pendingImports(
  offers: MasterclassOffer[],
  imported: Set<string>,
  crm: { company: string; role: string }[],
): ImportRow[] {
  const seen = new Set(crm.map((i) => crmKey(i.company, i.role)))
  const rows: ImportRow[] = []
  for (const o of offers) {
    if (imported.has(o.id)) continue
    const status = STATUS[o.estado || 'guardada']
    const company = (o.empresa || '').trim().slice(0, 80)
    if (!status || !company) continue
    const role = (o.puesto || '').trim().slice(0, 80) || 'Vacante H2B'
    const key = crmKey(company, role)
    if (seen.has(key)) continue
    seen.add(key)
    const url = /^https?:\/\//i.test(o.url || '') ? (o.url || '').slice(0, 300) : ''
    rows.push({
      sourceId: o.id,
      company_name: company,
      job_title: role,
      status,
      notes: url ? `Desde la masterclass. ${url}` : 'Desde la masterclass.',
    })
  }
  return rows
}
