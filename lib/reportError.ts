// Manda al backend los errores que pasan en el celular o navegador de la persona, para enterarnos sin que nadie avise.
// Discreto: como mucho 10 por visita, sin repetir el mismo, y sin ruido de extensiones del navegador o de la red.
import { supabase } from '@/lib/supabaseClient'

export type ErrorKind = 'error' | 'promesa' | 'pantalla'

const sent = new Set<string>()
const MAX_PER_VISIT = 10

// Mensajes que no son fallas de la app: extensiones, cortes de red, navegación cancelada
const NOISE = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /Failed to fetch|Load failed|NetworkError|network error|Network request failed/i,
  /AbortError|The user aborted|signal is aborted/i,
  /Loading chunk \d+ failed|ChunkLoadError/i, // al publicar una versión nueva; la app se recarga sola
  /chrome-extension:|moz-extension:|safari-extension:/i,
]

export function reportError(kind: ErrorKind, err: unknown) {
  try {
    if (typeof window === 'undefined' || sent.size >= MAX_PER_VISIT) return
    const message =
      err instanceof Error ? err.message || err.name : typeof err === 'string' ? err : (() => { try { return JSON.stringify(err) } catch { return String(err) } })()
    const stack = err instanceof Error ? err.stack || null : null
    if (!message || NOISE.some((re) => re.test(message) || (stack ? re.test(stack) : false))) return
    const key = `${kind}|${message}`
    if (sent.has(key)) return
    sent.add(key)

    void (async () => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      await fetch('/api/client-errors', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ kind, message: message.slice(0, 500), stack: stack?.slice(0, 4000), url: location.pathname + location.search }),
      })
    })().catch(() => {})
  } catch {
    // Reportar nunca debe romper nada
  }
}
