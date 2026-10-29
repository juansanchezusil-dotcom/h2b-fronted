'use client' // Los límites de error deben ser componentes de cliente

import { useEffect } from 'react'
import { reportError } from '@/lib/reportError'

// Falla del layout raíz: reemplaza toda la página, así que trae su propio <html> y estilos en línea
// (aquí no llegan globals.css ni el tema).
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    reportError('pantalla', error)
  }, [error])

  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08131F', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', padding: 24, textAlign: 'center' }}>
        <div role="alert" style={{ maxWidth: 360 }}>
          <h1 style={{ fontSize: 22, color: '#fff', margin: '0 0 8px' }}>Algo salió mal</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: '#94a3b8', margin: '0 0 24px' }}>
            No pudimos abrir la app. Tus datos no se perdieron. Intenta de nuevo y, si sigue pasando, recarga la página.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ minHeight: 48, padding: '0 28px', border: 0, borderRadius: 12, background: '#f5c518', color: '#0B2545', fontSize: 15, fontWeight: 700 }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  )
}
