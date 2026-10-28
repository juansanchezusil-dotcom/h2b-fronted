import type { Metadata } from 'next'
import LogoMark from '@/components/LogoMark'

export const metadata: Metadata = {
  title: 'Política de privacidad | Juan Te Avisa PRO',
  description: 'Qué datos guardamos, para qué los usamos, con quién los compartimos y cómo pedir que los borremos.',
}

const UPDATED = '14 de octubre de 2026'

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 mb-2 text-lg font-bold text-slate-900 dark:text-white">{children}</h2>
}

function L({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}

export default function PrivacidadPage() {
  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-slate-950 px-4 py-10">
      <article className="mx-auto max-w-2xl rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <div className="mb-6 flex items-center gap-3">
          <LogoMark size={40} decorative className="rounded-xl" />
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#08131F] dark:text-white">
            Juan Te Avisa <span className="text-[#b8860b]">PRO</span>
          </p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Política de privacidad</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Última actualización: {UPDATED}</p>

        <p className="mt-6">
          Esta política explica qué datos tuyos guardamos al usar Juan Te Avisa PRO, para qué los usamos y qué puedes hacer con ellos. La escribimos en lenguaje simple.
          Juan Te Avisa es una herramienta educativa y de organización. No es una agencia ni un despacho de abogados, y no garantiza visa, patrocinador, entrevista ni empleo.
        </p>

        <H>Qué datos guardamos</H>
        <L
          items={[
            'Tu correo y tu nombre de cuenta, que llegan al iniciar sesión con Google.',
            'Tu perfil: puesto y industria que buscas, nivel de inglés, país y habilidades.',
            'Tu CV y tu carta de presentación: las respuestas que das al asistente, el borrador y el texto final que se genera.',
            'Tus postulaciones: empresa, puesto, estado, notas y fechas de seguimiento.',
            'Tu actividad en la app: la fecha de tu última visita y los cambios de estado de tus postulaciones.',
            'Tu membresía: si está activa y la fecha de vencimiento.',
            'Un registro de los correos automáticos que te enviamos, para no repetirlos.',
            'Si usas el Mapa H2B público (sin cuenta): tu correo, tu nombre si lo escribes y tus respuestas del cuestionario (puesto, experiencia, inglés, si tienes CV y pasaporte). Si pides recuperar tu mapa, te enviamos un enlace a ese correo.',
            'Para frenar abusos en las páginas abiertas guardamos, por unos días, un código derivado de tu conexión. No guardamos tu dirección IP.',
            'En tu propio navegador se guardan avances como las casillas de tu plan o una práctica de entrevista a medias. Eso no sale de tu dispositivo, salvo lo que envías para que se evalúe.',
          ]}
        />
        <p className="mt-2">
          Los textos que pegas o escribes en los asistentes (por ejemplo un mensaje de una empresa o tus respuestas en el simulador de entrevistas) se envían al proveedor de inteligencia artificial para generar la respuesta y no se guardan en nuestra base de datos. No guardamos audio.
        </p>
        <p className="mt-2">No guardamos datos de tarjeta. El pago se hace en Skool y lo procesa esa plataforma.</p>

        <H>Para qué los usamos</H>
        <L
          items={[
            'Darte acceso y que la app funcione: tu CRM, tu Mapa, tus recordatorios de seguimiento.',
            'Armar tu CV, tu carta y tus simulacros con ayuda de inteligencia artificial.',
            'Saber si tu acceso está vigente y avisarte antes de que venza.',
            'Escribirte si llevas varios días sin entrar, para ofrecerte ayuda. Puedes darte de baja de estos avisos en cualquier momento.',
            'Entender cómo se usa el sistema para mejorarlo y acompañar mejor a los miembros.',
            'Si dejaste tu correo en el Mapa H2B público: escribirte sobre tu mapa y sobre la masterclass, solo porque lo autorizaste.',
          ]}
        />
        <p className="mt-2">No vendemos tus datos ni los usamos para publicidad de terceros.</p>

        <H>Con quién los compartimos</H>
        <p>Solo con los servicios que hacen funcionar la app, y solo lo necesario para cada función:</p>
        <L
          items={[
            'Supabase: base de datos y autenticación, donde se guardan tus datos.',
            'Vercel: alojamiento de la aplicación.',
            'Google (Gemini) y Anthropic (Claude): proveedores de inteligencia artificial. Cuando usas el asistente de CV, la carta, el detector de estafas o el simulador, el texto que escribes o subes (por ejemplo tu CV o una oferta) se envía a ellos para generar la respuesta.',
            'Resend: envío de correos.',
            'Skool: plataforma de la comunidad y de los pagos.',
          ]}
        />
        <p className="mt-2">
          Por eso te recomendamos no incluir en tu CV ni en el detector datos que no necesites compartir, como números de documento, de seguro social o de cuentas bancarias.
        </p>

        <H>Cuánto tiempo los guardamos</H>
        <p>
          Mientras tengas cuenta y mientras sea necesario para darte el servicio.
        </p>
        <p className="mt-2">
          Si borras tu cuenta, eliminamos tu perfil, tu CV y borradores, tus postulaciones y su historial, tus registros de correos y de uso, y tu contacto del Mapa público si usaste el mismo correo.
          Conservamos el registro de tu membresía (tu correo y sus fechas) para administrar tu acceso y los pagos, y lo que debamos guardar por obligación legal. Las copias de seguridad de nuestro proveedor pueden conservar datos por un tiempo limitado antes de eliminarse.
        </p>

        <H>Tus derechos</H>
        <p>Puedes pedirnos en cualquier momento:</p>
        <L
          items={[
            'Ver qué datos tuyos tenemos.',
            'Corregir lo que esté mal.',
            'Borrar tu cuenta y tus datos.',
            'Dejar de recibir nuestros correos (renovación, reenganche y los del Mapa público). Cada uno trae un enlace de baja.',
          ]}
        />
        <p className="mt-2">
          Puedes borrar tu cuenta tú mismo desde el menú de tu cuenta, en “Borrar mi cuenta”. Para cualquier otra solicitud, responde a cualquier correo que te hayamos enviado o escríbenos por la comunidad. Te respondemos lo antes posible.
        </p>

        <H>Seguridad</H>
        <p>
          Tus datos están protegidos con acceso por cuenta: cada persona solo puede ver lo suyo. Aun así, ningún sistema es infalible. Si detectamos un problema que te afecte, te lo diremos.
        </p>

        <H>Menores de edad</H>
        <p>El servicio es para personas mayores de 18 años.</p>

        <H>Cambios a esta política</H>
        <p>Si la cambiamos de forma importante, lo avisaremos en la app o por correo. La fecha de arriba indica la última versión.</p>
      </article>
    </main>
  )
}
