'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { COMMITMENT_DAYS, computeNotices, type Notices } from '@/lib/membershipNotices'

const DAY = 24 * 60 * 60 * 1000

// Lee, con la sesión de la persona, su fecha de alta, su vencimiento y sus propias postulaciones de los
// últimos 30 días, y calcula el avance del Compromiso de PRO. Si algo falla devuelve null: son datos de
// apoyo, la app funciona igual sin ellos.
export function useMembershipNotices(userId: string): Notices | null {
  const [notices, setNotices] = useState<Notices | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      const email = auth.user?.email?.trim().toLowerCase()
      if (!email) return
      const since = new Date(Date.now() - COMMITMENT_DAYS * DAY).toISOString()
      const [acceso, eventos] = await Promise.all([
        supabase.from('accesos').select('created_at, vence_el').eq('email', email).maybeSingle(),
        supabase
          .from('application_events')
          .select('company_name, from_status, to_status, created_at')
          .eq('user_id', userId)
          .gte('created_at', since),
      ])
      if (cancelled || acceso.error || eventos.error) return
      setNotices(computeNotices(acceso.data, eventos.data || [], Date.now()))
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  return notices
}
