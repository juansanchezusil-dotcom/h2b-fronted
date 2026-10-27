'use client'

import { useEffect } from 'react'
import { initPwa } from '@/lib/pwa'

// Registra el service worker apenas carga cualquier página, para no perder el aviso de instalación
export default function PwaInit() {
  useEffect(() => initPwa(), [])
  return null
}
