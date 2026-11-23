import { supabase } from '@/lib/supabaseClient'

// Las funciones de una oferta pueden venir con distintos nombres según de dónde se cargó la oferta
export function jobDutiesOf(job: { job_description?: string; job_duties?: string; description?: string; duties?: string } | null | undefined): string {
  if (!job) return ''
  return String(job.job_description || job.job_duties || job.description || job.duties || '').trim()
}

// Busca en el catálogo de ofertas las funciones de una oferta guardada en el CRM (el CRM no las guarda).
// Devuelve '' si no la encuentra o no tiene funciones.
export async function fetchJobDuties(company: string, role: string): Promise<string> {
  if (!company.trim() || !role.trim()) return ''
  const { data } = await supabase
    .from('jobs')
    .select('job_duties')
    .eq('employer_name', company)
    .eq('title', role)
    .not('job_duties', 'is', null)
    .limit(1)
    .maybeSingle()
  return String(data?.job_duties || '').trim()
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  }
}
