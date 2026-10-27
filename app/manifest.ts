import type { MetadataRoute } from "next";

// Permite instalar la app en la pantalla de inicio del celular: se abre a pantalla completa, sin barra del navegador
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Juan Te Avisa PRO",
    short_name: "Juan Te Avisa",
    description: "Ofertas H-2B oficiales del DOL, empresas con visas aprobadas y seguimiento de tus postulaciones.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    background_color: "#08131F",
    theme_color: "#08131F",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
