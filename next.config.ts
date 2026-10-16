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
        // Que nadie incruste la app (clickjacking). El Mapa y el dashboard de la masterclass se dejan fuera: pueden
        // mostrarse dentro de juanteavisa.com.
        source: '/((?!mapa|masterclass\\.html).*)',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ];
  },
};

export default nextConfig;
