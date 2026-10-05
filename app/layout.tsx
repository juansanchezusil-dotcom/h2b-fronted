import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Juan Te Avisa PRO - Sistema Operativo H2B",
  description: "Encuentra ofertas de trabajo H-2B verificadas, empresas patrocinadoras y agencias reguladas. Tu sistema operativo para el proceso de visa H-2B.",
  // Vista previa al compartir el enlace (WhatsApp, Instagram, Facebook)
  openGraph: {
    title: "Juan Te Avisa PRO - Sistema Operativo H2B",
    description: "Ofertas H-2B oficiales del DOL, empresas con visas aprobadas y seguimiento de tus postulaciones.",
    siteName: "Juan Te Avisa PRO",
    locale: "es_LA",
    type: "website",
  },
};

// viewport-fit=cover habilita env(safe-area-inset-*): sin esto el toast
// puede quedar bajo la barra de gestos/notch del celular.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Color de la barra del navegador en el celular, según el tema
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F6F8" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
