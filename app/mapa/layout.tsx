import type { Metadata } from 'next'

export const metadata: Metadata = {
  // Hasta la masterclass del 25 de noviembre: sin indexar. Al activar el Mapa, quita esta línea.
  robots: { index: false, follow: false },
  title: 'Mi Mapa H2B Personal | Juan Te Avisa',
  description: 'Responde 5 preguntas y recibe tu mapa: en qué etapa estás, qué sigue y cómo organizar tus primeros 30 días para buscar trabajo H-2B.',
  openGraph: {
    title: 'Mi Mapa H2B Personal | Juan Te Avisa',
    description: 'Responde 5 preguntas y recibe tu mapa para buscar trabajo H-2B.',
    siteName: 'Juan Te Avisa',
    locale: 'es_LA',
    type: 'website',
  },
}

export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return children
}
