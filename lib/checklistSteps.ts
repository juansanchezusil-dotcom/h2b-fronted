// Pasos manuales del mapa (pasaporte y DS-160). Se guardan en el navegador, separados por usuario,
// con la misma clave que usaba la hoja de ruta anterior, para no perder el avance de nadie.

export const CHECKLIST_TOTAL_TASKS = 5 // perfil, CV, pasaporte, 5 ofertas guardadas y DS-160

export interface ManualSteps {
  passport: boolean
  ds160: boolean
}

const EMPTY: ManualSteps = { passport: false, ds160: false }

const storageKey = (userId: string) => `h2b-checklist-${userId}`

export function readChecklistSteps(userId?: string): ManualSteps {
  if (!userId || typeof window === 'undefined') return { ...EMPTY }
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    const parsed = raw ? JSON.parse(raw) : {}
    return { passport: !!parsed.passport, ds160: !!parsed.ds160 }
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
