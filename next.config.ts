import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://h2b-backend-three.vercel.app/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        // Todas las páginas: que el navegador no adivine tipos de archivo, no filtre la dirección completa a otros
        // sitios y no abra cámara, micrófono ni ubicación.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // El service worker siempre se revisa en la red: así los cambios llegan apenas se publican
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        // Que nadie incruste la app (clickjacking). El Mapa y el dashboard de la masterclass se dejan fuera: pueden
        // mostrarse dentro de juanteavisa.com.
        source: '/((?!mapa|masterclass\\.html).*)',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ];
  },
};

export default nextConfig;
