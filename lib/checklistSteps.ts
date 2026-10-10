// Pasos manuales del mapa (pasaporte y DS-160). Se guardan en la base (profiles.manual_steps) para que no
// se pierdan al cambiar de dispositivo y para que el radar los vea. El navegador conserva una copia con la
// misma clave que usaba la hoja de ruta anterior: sirve para mostrar el avance al instante y para subir a la
// base lo que alguien ya había marcado antes de este cambio.

export const CHECKLIST_TOTAL_TASKS = 5 // perfil, CV, pasaporte, 5 ofertas guardadas y DS-160

export interface ManualSteps {
  passport: boolean
  ds160: boolean
  // Casillas del plan de 3 semanas marcadas a mano (id del paso -> true)
  plan?: Record<string, boolean>
}

const EMPTY: ManualSteps = { passport: false, ds160: false }

const storageKey = (userId: string) => `h2b-checklist-${userId}`

export function readChecklistSteps(userId?: string): ManualSteps {
  if (!userId || typeof window === 'undefined') return { ...EMPTY }
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    const parsed = raw ? JSON.parse(raw) : {}
    return { passport: !!parsed.passport, ds160: !!parsed.ds160, plan: parsed.plan && typeof parsed.plan === 'object' ? parsed.plan : {} }
  } catch {
    return { ...EMPTY }
  }
}

export function writeChecklistSteps(userId: string, steps: ManualSteps) {
  try {
    // Se conservan las claves viejas (como saved_jobs) para no pisar datos de otras versiones
    const raw = window.localStorage.getItem(storageKey(userId))
    const previous = raw ? JSON.parse(raw) : {}
    window.localStorage.setItem(storageKey(userId), JSON.stringify({ ...previous, ...steps }))
  } catch {
    // Sin almacenamiento (modo privado): el avance dura solo esta visita
  }
}

// Cliente mínimo de Supabase que necesitamos (evita depender del tipo completo)
interface DbClient {
  from: (table: string) => any
}

// Guarda los pasos en la base. Si falla, el avance sigue en el navegador y se vuelve a intentar al marcar otra vez.
export async function saveStepsRemote(db: DbClient, userId: string, steps: ManualSteps): Promise<boolean> {
  const { error } = await db.from('profiles').upsert({ id: userId, manual_steps: steps })
  if (error) console.error('No se pudieron guardar los pasos del mapa:', error.message)
  return !error
}

// Lee los pasos: lo de la base y lo del navegador se unen (marcado en cualquiera de los dos cuenta como
// marcado) y, si el navegador tenía algo que la base no, se sube. Nunca desmarca nada por sí solo.
export async function loadSteps(db: DbClient, userId: string): Promise<ManualSteps> {
  const local = readChecklistSteps(userId)
  try {
    const { data, error } = await db.from('profiles').select('manual_steps').eq('id', userId).maybeSingle()
    if (error) return local
    const remote = data?.manual_steps || {}
    // Si la base ya tiene los pasos guardados, manda la base (así desmarcar en un dispositivo vale en todos).
    // Si nunca se guardaron, se sube lo que había en el navegador.
    if ('passport' in remote || 'ds160' in remote || 'plan' in remote) {
      const fromDb: ManualSteps = { passport: !!remote.passport, ds160: !!remote.ds160, plan: remote.plan && typeof remote.plan === 'object' ? remote.plan : {} }
      writeChecklistSteps(userId, fromDb)
      return fromDb
    }
    if (local.passport || local.ds160 || Object.keys(local.plan || {}).length) await saveStepsRemote(db, userId, local)
    return local
  } catch {
    return local
  }
}
