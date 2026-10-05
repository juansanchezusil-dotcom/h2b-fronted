import Link from 'next/link'

// Página 404 con la marca: antes se veía la de Next por defecto.
export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#F4F6F8] dark:bg-slate-950 px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-sm font-bold tracking-widest text-[#C89B3C] tabular-nums">404</p>
        <h1 className="text-2xl font-black text-[#08131F] dark:text-white">Esta página no existe</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Puede que el enlace esté mal escrito o que la página ya no esté disponible.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[#C89B3C] px-5 py-3 text-sm font-bold text-[#08131F] shadow-md hover:bg-[#b08833] transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
