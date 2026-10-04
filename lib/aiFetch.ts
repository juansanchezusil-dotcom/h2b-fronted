import { supabase } from '@/lib/supabaseClient'

// Los asistentes de IA exigen sesión: el backend valida este token para saber
// quién llama y aplicar el límite diario de uso.
export async function aiFetch(input: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers })
}
