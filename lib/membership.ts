import type { SupabaseClient } from '@supabase/supabase-js'

// Una membresía da acceso si está activa y no ha vencido (vence_el vacío = sin vencimiento).
// Si la columna vence_el todavía no existe en la base, cae a revisar solo "activo"
// para no dejar afuera a todos los miembros.
export async function hasActiveMembership(supabase: SupabaseClient, email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase()
  const full = await supabase.from('accesos').select('activo, vence_el').eq('email', clean).maybeSingle()
  if (!full.error) {
    const a = full.data
    return !!a?.activo && (!a.vence_el || new Date(a.vence_el).getTime() > Date.now())
  }
  const basic = await supabase.from('accesos').select('activo').eq('email', clean).maybeSingle()
  return !!basic.data?.activo
}
