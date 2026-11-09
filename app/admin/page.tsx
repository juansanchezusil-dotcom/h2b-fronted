'use client'

import { Suspense } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { ResumenView } from '@/components/admin/ResumenView'
import { MiembrosView } from '@/components/admin/MiembrosView'
import { RadarView } from '@/components/admin/RadarView'
import { OperacionView } from '@/components/admin/OperacionView'
import type { MiembrosData, OperacionData, RadarData, ResumenData, Vista } from '@/lib/adminPanel'

// Panel del administrador: 4 vistas (resumen, miembros, radar, operación) con filtros en la URL.
// Las herramientas de detalle (membresías, ofertas, correos, push, errores) viven dentro de cada vista.
function view(vista: Vista, data: unknown) {
  // Si la respuesta es de otra vista (se acaba de cambiar), se muestra el esqueleto hasta que llegue la correcta
  const d = data as { kpis?: unknown; resumen?: unknown; ia?: unknown; embudo?: unknown; cohortes?: unknown } | null
  const ok = {
    resumen: !!d && 'salud' in d,
    miembros: !!d && 'cohortes' in d,
    radar: !!d && 'lista' in d,
    operacion: !!d && 'ia' in d,
  }[vista]
  const payload = ok ? data : null
  switch (vista) {
    case 'miembros':
      return <MiembrosView data={payload as MiembrosData | null} />
    case 'radar':
      return <RadarView data={payload as RadarData | null} />
    case 'operacion':
      return <OperacionView data={payload as OperacionData | null} />
    default:
      return <ResumenView data={payload as ResumenData | null} />
  }
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando el panel...</div>}>
      <AdminShell render={view} />
    </Suspense>
  )
}
