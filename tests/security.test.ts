import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/membership', () => ({ hasActiveMembership: async () => true }))
// Sin sesión: el proxy no necesita hablar con Supabase en estas pruebas
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) }))

import { proxy } from '@/proxy'
import { mailtoHref } from '@/lib/mailto'

const onMapa = (path: string) => proxy(new NextRequest(`https://mapa.juanteavisa.com${path}`, { headers: { host: 'mapa.juanteavisa.com' } }))

describe('redirección del dominio del Mapa', () => {
  it('manda las rutas ajenas a la app, conservando ruta y parámetros', async () => {
    const res = await onMapa('/login?x=1')
    expect(res.headers.get('location')).toBe('https://app.juanteavisa.com/login?x=1')
  })

  it('nunca sale del dominio de la app', async () => {
    for (const path of ['//evil.example/x', '/%2F/evil.example', '//evil.example:443/x']) {
      const location = (await onMapa(path)).headers.get('location') || ''
      expect(new URL(location).origin).toBe('https://app.juanteavisa.com')
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

describe('dominio antiguo', () => {
  const onOld = (path: string) => proxy(new NextRequest(`https://h2b-fronted.vercel.app${path}`, { headers: { host: 'h2b-fronted.vercel.app' } }))

  it('manda todo a app.juanteavisa.com con la misma ruta', async () => {
    const res = await onOld('/login?x=1')
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('https://app.juanteavisa.com/login?x=1')
  })

  it('deja la masterclass donde está (lo guardado vive en ese dominio)', async () => {
    const res = await onOld('/masterclass.html')
    expect(res.headers.get('location')).toBeNull()
  })

  it('nunca sale del dominio de la app', async () => {
    const location = (await onOld('//evil.example/x')).headers.get('location') || ''
    expect(new URL(location).origin).toBe('https://app.juanteavisa.com')
  })
})

describe('CSP', () => {
  const onApp = (path: string) => proxy(new NextRequest(`https://app.juanteavisa.com${path}`, { headers: { host: 'app.juanteavisa.com' } }))

  it('las páginas solo corren scripts con el nonce de la visita', async () => {
    const a = (await onApp('/privacidad')).headers.get('content-security-policy') || ''
    const b = (await onApp('/privacidad')).headers.get('content-security-policy') || ''
    expect(a).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/)
    expect(a).toContain("object-src 'none'")
    expect(a).not.toBe(b)
  })

  it('la masterclass estática no lleva nonce (su script en línea seguiría corriendo)', async () => {
    const csp = (await onApp('/masterclass.html')).headers.get('content-security-policy') || ''
    expect(csp).not.toContain('script-src')
  })
})
