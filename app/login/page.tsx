"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import LogoMark from "@/components/LogoMark";

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  };

  // Entrada con correo (Hotmail, Outlook, iCloud, Yahoo...): te llega un código de 6 dígitos y lo escribes aquí.
  // Es un código y no un enlace a propósito: el enlace falla si el correo se abre en otro navegador (pasa mucho en el celular).
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) {
      setMsg({ kind: "error", text: "Escribe un correo válido." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) {
      const wait = /rate|seconds|too many/i.test(error.message);
      setMsg({
        kind: "error",
        text: wait ? "Pediste muchos códigos. Espera unos minutos e intenta de nuevo." : "No pudimos enviar el código. Revisa el correo e intenta de nuevo.",
      });
      return;
    }
    setEmail(clean);
    setStep("code");
    setCode("");
    setCooldown(60);
    setMsg({ kind: "info", text: `Te enviamos un código a ${clean}. Revisa también la carpeta de spam.` });
  };

  const verifyCode = async () => {
    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      setMsg({ kind: "error", text: "Escribe el código completo que te llegó al correo." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      setBusy(false);
      setMsg({ kind: "error", text: "El código no es correcto o ya venció. Revísalo o pide uno nuevo." });
      return;
    }
    // La sesión ya quedó guardada; si no tiene membresía, la app lo manda a la pantalla de acceso
    window.location.href = "/";
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6 flex flex-col items-center">
          <LogoMark size={64} decorative className="rounded-2xl shadow-sm" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-[#08131F]">
            Juan Te Avisa <span className="text-[#b8860b]">PRO</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-5">
            Iniciar sesión
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Accede al Centro de Control H2B y gestión de vacantes.
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          o con tu correo (Hotmail, Outlook, iCloud, Yahoo…)
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        {step === "email" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
            className="text-left"
          >
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
              Tu correo
            </label>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@correo.com"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-base text-gray-900 outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#b8860b]/30"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-3 w-full rounded-xl bg-[#08131F] py-3 px-4 font-medium text-white transition-colors hover:bg-[#12263a] disabled:opacity-60 cursor-pointer"
            >
              {busy ? "Enviando…" : "Enviarme un código"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verifyCode();
            }}
            className="text-left"
          >
            <label htmlFor="login-code" className="block text-sm font-medium text-gray-700">
              Código de 6 dígitos
            </label>
            <input
              id="login-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-center text-xl tracking-[0.3em] text-gray-900 outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#b8860b]/30"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-3 w-full rounded-xl bg-[#08131F] py-3 px-4 font-medium text-white transition-colors hover:bg-[#12263a] disabled:opacity-60 cursor-pointer"
            >
              {busy ? "Verificando…" : "Entrar"}
            </button>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setMsg(null);
                }}
                className="underline cursor-pointer"
              >
                Cambiar correo
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || busy}
                onClick={() => void sendCode()}
                className="underline disabled:no-underline disabled:opacity-60 cursor-pointer"
              >
                {cooldown > 0 ? `Reenviar código (${cooldown}s)` : "Reenviar código"}
              </button>
            </div>
          </form>
        )}

        {msg && (
          <p role={msg.kind === "error" ? "alert" : "status"} className={`mt-3 text-sm ${msg.kind === "error" ? "text-red-600" : "text-slate-600"}`}>
            {msg.text}
          </p>
        )}

        <p className="mt-4 text-center text-xs text-slate-500">
          Al continuar aceptas el uso de tus datos según nuestra{" "}
          <a href="/privacidad" className="underline">política de privacidad</a>.
        </p>
      </div>
    </div>
  );
}
