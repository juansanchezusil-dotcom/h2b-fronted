import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const cosUserId = process.env.CAREERONESTOP_USER_ID
const cosApiKey = process.env.CAREERONESTOP_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Falta NEXT_PUBLIC_SUPABASE_URL o SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

if (!cosUserId || !cosApiKey) {
  console.error('❌ Error: Falta CAREERONESTOP_USER_ID o CAREERONESTOP_API_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Endpoint de Jobs de CareerOneStop V2 (busca vacantes en EE. UU.)
const COS_ENDPOINT = `https://api.careeronestop.org/v1/jobsearch/${cosUserId}/H2B/US/0/10/20`

async function fetchCareerOneStopJobs() {
  console.log('🔄 Conectando a CareerOneStop API con tu API Key...')

  try {
    const response = await fetch(COS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cosApiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP Error CareerOneStop: ${response.status} ${response.statusText}`)
    }

    const json = await response.json()
    const rawJobs = json.Jobs || json.JobsList || []

    if (!Array.isArray(rawJobs) || rawJobs.length === 0) {
      console.log('⚠️ La API respondió correctamente pero no se encontraron ofertas para este término.')
      return
    }

    console.log(`📦 Se obtuvieron ${rawJobs.length} ofertas reales de CareerOneStop. Procesando...`)

    const formattedJobs = rawJobs.map((item: any) => ({
      title: item.JobTitle || 'Trabajador H-2B',
      company: item.Company || 'Empresa Registrada',
      location: item.Location || 'EE. UU.',
      wage: item.Wage || '$16.50 / hr',
      start_date: item.AcquisitionDate ? new Date(item.AcquisitionDate).toISOString().split('T')[0] : null,
      end_date: null,
      job_order_pdf_url: item.URL || 'https://www.careeronestop.org',
      case_number: item.JobPostingID || String(Math.random())
    }))

    const { error } = await supabase
      .from('jobs')
      .upsert(formattedJobs, { onConflict: 'case_number' })

    if (error) {
      console.error('❌ Error guardando en Supabase:', error.message)
    } else {
      console.log(`✅ ¡Sincronización exitosa! Se guardaron ${formattedJobs.length} vacantes desde CareerOneStop.`)
    }

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error)
  }
}

fetchCareerOneStopJobs()