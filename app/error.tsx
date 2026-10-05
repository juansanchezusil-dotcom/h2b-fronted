'use client' // Los límites de error deben ser componentes de cliente

import { useEffect } from 'react'

// En esta versión de Next el reintento se llama unstable_retry (antes era reset).
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#F4F6F8] dark:bg-slate-950 px-4">
      <div role="alert" className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-black text-[#08131F] dark:text-white">Algo salió mal</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No pudimos mostrar esta pantalla. Tus datos no se perdieron. Intenta de nuevo y, si sigue pasando, recarga la página.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-xl bg-[#C89B3C] px-5 py-3 text-sm font-bold text-[#08131F] shadow-md hover:bg-[#b08833] transition"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
