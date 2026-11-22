import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import nextConfig from '../next.config'

// El 21-nov el botón "Dictar" dejó de funcionar porque la cabecera Permissions-Policy decía microphone=():
// el navegador bloqueaba el micrófono aunque la persona le diera permiso. Estas pruebas fallan si el código usa
// una función del navegador (micrófono, cámara, ubicación) que la cabecera tiene bloqueada.

const ROOT = join(__dirname, '..')
const SOURCE_DIRS = ['app', 'components', 'hooks', 'lib']

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

const allSource = SOURCE_DIRS.flatMap((d) => sourceFiles(join(ROOT, d)))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')

// Qué texto del código necesita cada permiso de la cabecera
const FEATURES: Record<string, RegExp> = {
  microphone: /SpeechRecognition|getUserMedia\(\s*\{[^}]*audio|useDictation/,
  camera: /getUserMedia\(\s*\{[^}]*video|capture=/,
  geolocation: /navigator\.geolocation/,
}

async function permissionsPolicy(): Promise<Record<string, string>> {
  const rules = (await nextConfig.headers?.()) ?? []
  const all = rules.find((r) => r.source === '/:path*')
  const value = all?.headers.find((h) => h.key === 'Permissions-Policy')?.value ?? ''
  return Object.fromEntries(
    value
      .split(',')
      .map((part) => part.trim().split('='))
      .filter(([k]) => k)
      .map(([k, v]) => [k, v ?? ''])
  )
}

describe('Permissions-Policy', () => {
  for (const [feature, usage] of Object.entries(FEATURES)) {
    it(`no bloquea ${feature} si la app lo usa`, async () => {
      const policy = await permissionsPolicy()
      if (!usage.test(allSource)) return
      expect(policy[feature], `la app usa ${feature} pero la cabecera dice ${feature}=${policy[feature]}`).not.toBe('()')
    })
  }

  it('el dictado sigue disponible para la propia app', async () => {
    const policy = await permissionsPolicy()
    expect(policy.microphone).toBe('(self)')
  })
})
