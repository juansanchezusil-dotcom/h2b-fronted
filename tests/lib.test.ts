import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// reportError usa el cliente de Supabase solo para leer la sesión: aquí se reemplaza por uno falso
vi.mock('@/lib/supabaseClient', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
}))

import { errorMessage } from '@/lib/errors'
import { crmKey, crmColumnOf, labelForStatus, splitWage } from '@/lib/h2b'

describe('errorMessage', () => {
  it('muestra el mensaje real o el texto de respaldo', () => {
    expect(errorMessage(new Error('Sin conexión'))).toBe('Sin conexión')
    expect(errorMessage({ message: 'de supabase' })).toBe('de supabase')
    expect(errorMessage(undefined, 'Intenta de nuevo')).toBe('Intenta de nuevo')
    expect(errorMessage(new Error(''), 'Respaldo')).toBe('Respaldo')
  })
})

describe('lib/h2b', () => {
  it('crmKey reconoce la misma postulación aunque cambien mayúsculas o espacios', () => {
    expect(crmKey('Green Valley ', 'Laborer')).toBe(crmKey('green valley', 'LABORER'))
    expect(crmKey('Smith  Farms', ' Housekeeper')).toBe('smith farms|housekeeper')
  })
  it('crmColumnOf junta rechazadas y no respondidas en "cerradas"', () => {
    expect(crmColumnOf('rechazada')).toBe('cerradas')
    expect(crmColumnOf('no_respondido')).toBe('cerradas')
    expect(crmColumnOf('seguimiento')).toBe('seguimiento')
  })
  it('labelForStatus tiene texto para cada estado', () => {
    expect(labelForStatus('aceptado')).toBe('¡Oferta aceptada!')
    expect(labelForStatus('desconocido')).toBe('Actualizado')
  })
  it('splitWage separa monto y unidad en español', () => {
    expect(splitWage('$21.12 / hour')).toEqual({ amount: '$21.12', unit: 'hora' })
    expect(splitWage(null)).toBeNull()
  })
})

describe('reportError', () => {
  const fetchMock = vi.fn(async () => new Response('{}'))
  beforeEach(() => {
    vi.resetModules()
    fetchMock.mockClear()
    vi.stubGlobal('window', {})
    vi.stubGlobal('location', { pathname: '/', search: '' })
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  const flush = () => new Promise((r) => setTimeout(r, 0))

  it('manda un error real una sola vez', async () => {
    const { reportError } = await import('@/lib/reportError')
    reportError('error', new Error('Cannot read properties of undefined'))
    reportError('error', new Error('Cannot read properties of undefined'))
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body).toMatchObject({ kind: 'error', message: 'Cannot read properties of undefined', url: '/' })
  })

  it.each(['Failed to fetch', 'Load failed', 'ResizeObserver loop limit exceeded', 'Script error.', 'ChunkLoadError: Loading chunk 5 failed'])(
    'ignora el ruido "%s"',
    async (msg) => {
      const { reportError } = await import('@/lib/reportError')
      reportError('error', new Error(msg))
      await flush()
      expect(fetchMock).not.toHaveBeenCalled()
    }
  )

  it('no manda más de 10 por visita', async () => {
    const { reportError } = await import('@/lib/reportError')
    for (let i = 0; i < 15; i++) reportError('error', new Error(`Error distinto ${'x'.repeat(i)}`))
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(10)
  })
})
