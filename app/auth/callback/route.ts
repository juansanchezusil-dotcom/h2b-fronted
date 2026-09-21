import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    let response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.headers.get("cookie")?.split("; ").map((c) => {
              const [name, ...val] = c.split("=");
              return { name, value: val.join("=") };
            }) ?? [];
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session?.user?.email) {
      const cleanEmail = session.user.email.trim().toLowerCase();

      const { data: acceso } = await supabase
        .from("accesos")
        .select("activo")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (acceso?.activo) {
        return response; // <-- Devuelve la respuesta con las cookies guardadas
      }
    }
  }

  return NextResponse.redirect(`${origin}/no-acceso`);
}
