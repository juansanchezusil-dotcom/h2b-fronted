"use client";

import { supabase } from "@/lib/supabaseClient";

// Cierra la sesión (si la hay) y vuelve al login para elegir otra cuenta de Google
export default function SignOutButton() {
  const handleClick = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleClick}
      className="w-full px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
    >
      Entrar con otra cuenta de Google
    </button>
  );
}
