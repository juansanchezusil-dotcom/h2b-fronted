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

    const { data: agencies, error } = await supabase
      .from('sponsor_agencies')
      .select('*')
      .order('case_count', { ascending: false })

    if (error) {
      console.error('Error de Supabase consultando sponsor_agencies:', error)
      return NextResponse.json([], { status: 500 })
    }

    return NextResponse.json(agencies || [])
  } catch (err) {
    console.error('Error en API Route /api/agencies:', err)
    return NextResponse.json([], { status: 500 })
  }
}