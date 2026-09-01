export const revalidate = 0;
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PROJECT_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Faltan las variables de entorno de Supabase en .env.local')
      return NextResponse.json([], { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Filtrar para obtener solo ofertas sincronizadas en los últimos 7 días
  const recentDate = new Date()
  recentDate.setDate(recentDate.getDate() - 7)

  const { data: jobs, error } = await supabase
  .from('jobs')
  .select('*')
  .order('created_at', { ascending: false });

    if (error) {
      console.error('Error de Supabase consultando jobs:', error)
      return NextResponse.json([], { status: 500 })
    }

    return NextResponse.json(jobs || [])
  } catch (err) {
    console.error('Error en API Route /api/jobs:', err)
    return NextResponse.json([], { status: 500 })
  }
}