import type { SupabaseClient } from '@supabase/supabase-js'

// Una membresía da acceso si está activa y no ha vencido (vence_el vacío = sin vencimiento).
export async function hasActiveMembership(supabase: SupabaseClient, email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase()
  const { data: a, error } = await supabase.from('accesos').select('activo, vence_el').eq('email', clean).maybeSingle()
  if (error) {
    console.error('No se pudo revisar la membresía:', error.message)
    return false
  }
  return !!a?.activo && (!a.vence_el || new Date(a.vence_el).getTime() > Date.now())
}
