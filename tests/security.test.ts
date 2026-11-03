import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/membership', () => ({ hasActiveMembership: async () => true }))

import { proxy } from '@/proxy'
import { mailtoHref } from '@/lib/mailto'

const onMapa = (path: string) => proxy(new NextRequest(`https://mapa.juanteavisa.com${path}`, { headers: { host: 'mapa.juanteavisa.com' } }))

describe('redirección del dominio del Mapa', () => {
  it('manda las rutas ajenas a la app, conservando ruta y parámetros', async () => {
    const res = await onMapa('/login?x=1')
    expect(res.headers.get('location')).toBe('https://h2b-fronted.vercel.app/login?x=1')
  })

  it('nunca sale del dominio de la app', async () => {
    for (const path of ['//evil.example/x', '/%2F/evil.example', '//evil.example:443/x']) {
      const location = (await onMapa(path)).headers.get('location') || ''
      expect(new URL(location).origin).toBe('https://h2b-fronted.vercel.app')
    }
  })
})

describe('mailtoHref', () => {
  it('deja igual un correo normal', () => {
    expect(mailtoHref(' jobs@empresa.com ')).toBe('mailto:jobs@empresa.com')
  })

  it('un correo de una oferta no puede agregar campos al mensaje', () => {
    const href = mailtoHref('a@b.com?bcc=x@y.com&body=hola')
    expect(href).toBe('mailto:a@b.com%3Fbcc%3Dx@y.com%26body%3Dhola')
    expect(href).not.toContain('?')
  })

  it('codifica asunto y mensaje', () => {
    expect(mailtoHref('a@b.com', { subject: 'Hola & más', body: 'x=1' })).toBe('mailto:a@b.com?subject=Hola%20%26%20m%C3%A1s&body=x%3D1')
  })
})
