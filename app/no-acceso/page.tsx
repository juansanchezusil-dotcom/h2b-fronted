import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import SignOutButton from "./SignOutButton";

// Enlace de compra opcional: se configura en Vercel sin tocar código
const MEMBERSHIP_URL = process.env.NEXT_PUBLIC_MEMBERSHIP_URL;

export default async function NoAccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isLoginError = params.motivo === "error";

  // El correo llega por la URL (desde el login) o de la sesión viva
  // (cuando la membresía se desactivó estando dentro).
  let email = typeof params.correo === "string" ? params.correo : null;
  if (!email) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-5">
        {isLoginError ? (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No pudimos iniciar tu sesión</h1>
            <p className="text-sm text-gray-600">
              Hubo un problema al conectar con Google. No es un tema de tu membresía: vuelve a intentarlo.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Tu correo no tiene una membresía activa</h1>
            {email && (
              <p className="text-sm text-gray-600">
                Entraste con <strong className="text-gray-900 break-all">{email}</strong>.
              </p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              Si pagaste con otro correo, entra con esa cuenta de Google. Si tu membresía venció o la cancelaste,
              puedes renovarla para volver a entrar.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <SignOutButton />
          {!isLoginError && MEMBERSHIP_URL && (
            <a
              href={MEMBERSHIP_URL}
              className="block w-full px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Obtener mi membresía
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
