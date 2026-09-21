import Link from "next/link";

export default function NoAccesoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
        <p className="text-sm text-gray-600 mb-6">
          No cuentas con una membresía activa asociada a este correo.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
