import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasActiveMembership } from "@/lib/membership";

export async function middleware(request: NextRequest) {
  // mapa.juanteavisa.com muestra directo el Mapa H2B público (abierto, sin cuenta)
  const host = request.headers.get("host") || "";
  if (host.startsWith("mapa.") && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/mapa", request.url));
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Si NO ha iniciado sesión y quiere entrar a cualquier ruta protegida (incluyendo la raíz `/`),
  // lo redirige inmediatamente a /login
  if (!user && pathname !== "/login" && pathname !== "/no-acceso" && pathname !== "/privacidad" && pathname !== "/masterclass.html" && pathname !== "/mapa" && !pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Si YA ha iniciado sesión e intenta ir a /login, lo manda de vuelta a la app principal
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. La membresía se revisa en cada visita, no solo al iniciar sesión:
  // si el webhook de pago la desactiva (reembolso/cancelación), el acceso se corta
  // aunque la sesión siga viva. Las rutas /api se sirven desde el backend.
  // /admin solo existe para los correos de ADMIN_EMAILS; al resto se le manda a la app sin mostrarle nada.
  // (Los datos igual están protegidos en el backend; esto solo evita que vean la página.)
  if (user?.email && pathname.startsWith("/admin")) {
    const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!admins.includes(user.email.trim().toLowerCase())) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  const isPublic = pathname === "/no-acceso" || pathname === "/privacidad" || pathname === "/masterclass.html" || pathname === "/mapa" || pathname.startsWith("/auth") || pathname.startsWith("/api");
  if (user?.email && !isPublic) {
    if (!(await hasActiveMembership(supabase, user.email))) {
      return NextResponse.redirect(new URL("/no-acceso", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
