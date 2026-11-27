import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasActiveMembership } from "@/lib/membership";
import { appCsp, BASE_CSP, newNonce, usesNonce } from "@/lib/csp";

const APP_ORIGIN = "https://app.juanteavisa.com";
const OLD_HOST = "h2b-fronted.vercel.app";

export async function proxy(request: NextRequest) {
  // mapa.juanteavisa.com muestra directo el Mapa H2B público (abierto, sin cuenta)
  const host = request.headers.get("host") || "";
  // El dominio antiguo manda todo a app.juanteavisa.com. La página de la masterclass se queda: lo que alguien
  // guardó allí vive en el navegador de ese dominio y se perdería con la redirección.
  if (host === OLD_HOST && request.nextUrl.pathname !== "/masterclass.html") {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, APP_ORIGIN);
    return NextResponse.redirect(target.origin === APP_ORIGIN ? target : new URL("/", APP_ORIGIN), 308);
  }
  if (host.startsWith("mapa.")) {
    const p = request.nextUrl.pathname;
    if (p === "/") return NextResponse.rewrite(new URL("/mapa", request.url));
    // Solo el Mapa y lo que necesita (política, imágenes de compartir) viven en este dominio. El login y la
    // app están en el dominio de la app: el inicio de sesión de Google solo está autorizado allí.
    const own = p === "/mapa" || p === "/privacidad" || /^\/(opengraph-image|twitter-image|icon|apple-icon)/.test(p);
    if (!own) {
      // Una ruta como "//otro-sitio.com" cambiaría el dominio de destino: solo se redirige dentro de la app
      const target = new URL(p + request.nextUrl.search, APP_ORIGIN);
      return NextResponse.redirect(target.origin === APP_ORIGIN ? target : new URL("/", APP_ORIGIN));
    }
  }

  // Nonce de esta visita: Next lo lee del CSP de la petición y lo pone en sus scripts; el layout lo pasa al script
  // del tema. La misma política va en la respuesta para que el navegador la aplique.
  const csp = usesNonce(request.nextUrl.pathname) ? appCsp(newNonce()) : BASE_CSP;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);
  const withCsp = (res: NextResponse) => {
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
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
          // request.cookies.set actualiza la cabecera cookie de la petición: se copia para que la página la vea
          requestHeaders.set("cookie", request.headers.get("cookie") || "");
          response = NextResponse.next({
            request: { headers: requestHeaders },
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

  return withCsp(response);
}

export const config = {
  matcher: [
    // manifest, sw.js y offline.html se piden sin sesión (instalar la app y la página sin conexión), y los errores
    // de la app se reportan aunque la persona aún no haya entrado
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|offline\\.html|api/client-errors|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
