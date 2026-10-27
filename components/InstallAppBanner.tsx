'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Download, Share, X } from 'lucide-react'
import LogoMark from '@/components/LogoMark'
import { initPwa, subscribeInstall, getInstallState, promptInstall, type InstallState } from '@/lib/pwa'

const DISMISS_KEY = 'jta:installDismissed'

export function useInstallState(): InstallState {
  useEffect(() => initPwa(), [])
  return useSyncExternalStore(subscribeInstall, getInstallState, () => 'none')
}

// Tarjeta del Inicio (solo celular) que invita a instalar la app. Se puede cerrar y no vuelve a salir.
export default function InstallAppBanner() {
  const state = useInstallState()
  const [dismissed, setDismissed] = useState(true)
  const [showIosSteps, setShowIosSteps] = useState(false)

  useEffect(() => {
    // localStorage solo existe en el navegador
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  if (dismissed || (state !== 'prompt' && state !== 'ios')) return null

  const close = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="sm:hidden relative rounded-2xl border border-[#f5c518]/40 bg-[#08131F] text-white p-4 pr-11">
      <button
        onClick={close}
        aria-label="Cerrar"
        className="absolute top-1.5 right-1.5 w-10 h-10 flex items-center justify-center text-slate-400"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <LogoMark size={44} decorative className="shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="font-bold text-sm">Instala Juan Te Avisa en tu celular</p>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Ábrela desde tu pantalla de inicio, como cualquier app, sin buscar el enlace.
          </p>
          {state === 'prompt' ? (
            <button
              onClick={async () => {
                if (await promptInstall()) close()
              }}
              className="mt-3 inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-[#f5c518] text-[#0B2545] text-sm font-bold"
            >
              <Download className="w-4 h-4" /> Instalar app
            </button>
          ) : showIosSteps ? (
            <ol className="mt-3 space-y-1.5 text-xs text-slate-200 list-decimal pl-4">
              <li>
                Toca <Share className="inline w-3.5 h-3.5 -mt-0.5" aria-label="Compartir" /> <b>Compartir</b> en la barra del navegador.
              </li>
              <li>
                Elige <b>Agregar a inicio</b>.
              </li>
              <li>
                Toca <b>Agregar</b>. Listo.
              </li>
            </ol>
          ) : (
            <button
              onClick={() => setShowIosSteps(true)}
              className="mt-3 inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-[#f5c518] text-[#0B2545] text-sm font-bold"
            >
              <Download className="w-4 h-4" /> Cómo instalarla
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
