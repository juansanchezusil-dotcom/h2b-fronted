import { createBrowserClient } from "@supabase/ssr";
import { useUserAccess } from "@/hooks/useUserAccess";

export default function UserMenu() {
  const { user, hasAccess, loading } = useUserAccess();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return <div className="text-xs text-gray-400">Cargando...</div>;
  }

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Iniciar Sesión
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs font-semibold text-gray-800">{user.email}</p>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            hasAccess
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {hasAccess ? "PRO ACTIVO" : "SIN MEMBRESÍA"}
        </span>
      </div>

      <button
        onClick={handleLogout}
        className="text-xs text-gray-500 hover:text-gray-800 underline"
      >
        Salir
      </button>
    </div>
  );
}