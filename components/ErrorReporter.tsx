'use client'

import { useEffect } from 'react'
import { reportError } from '@/lib/reportError'

// Escucha los errores sin atrapar de toda la app (los de pantalla los reporta app/error.tsx)
export default function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportError('error', e.error ?? e.message)
    const onRejection = (e: PromiseRejectionEvent) => reportError('promesa', e.reason)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return null
}
