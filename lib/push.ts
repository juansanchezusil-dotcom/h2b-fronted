// Avisos push en el celular: ofertas nuevas de tu puesto y seguimientos pendientes.
// El backend (/api/push) guarda la suscripción de cada dispositivo y el cron diario envía los avisos.
import { aiFetch } from '@/lib/aiFetch'

export type PushState =
  | 'loading'
  | 'unsupported' // el navegador no tiene avisos
  | 'needs-install' // iPhone: solo funcionan con la app instalada en la pantalla de inicio
  | 'unavailable' // el backend todavía no tiene las claves
  | 'denied' // la persona los bloqueó en el navegador
  | 'off'
  | 'on'

const isIos = () => {
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

let publicKeyCache: string | null | undefined

async function publicKey(): Promise<string | null> {
  if (publicKeyCache !== undefined) return publicKeyCache
  try {
    const res = await fetch('/api/push')
    const data = await res.json()
    publicKeyCache = data.enabled && data.publicKey ? (data.publicKey as string) : null
  } catch {
    publicKeyCache = null
  }
  return publicKeyCache
}

function toUint8(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export async function getPushState(): Promise<PushState> {
  if (typeof window === 'undefined') return 'loading'
  if (isIos() && !isStandalone()) return 'needs-install'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (!(await publicKey())) return 'unavailable'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

// Pide permiso (debe llamarse desde un toque del usuario) y registra el dispositivo en el backend
export async function enablePush(): Promise<PushState> {
  const key = await publicKey()
  if (!key) return 'unavailable'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'
  const reg = await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8(key) }))
  const res = await aiFetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  })
  if (!res.ok) {
    await sub.unsubscribe().catch(() => {})
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'No pudimos activar los avisos. Intenta de nuevo.')
  }
  return 'on'
}

export async function disablePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await aiFetch('/api/push', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {})
    await sub.unsubscribe().catch(() => {})
  }
  return 'off'
}
