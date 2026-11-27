// Política de seguridad de contenido (CSP) de las páginas de la app. Solo corren los scripts que traen el nonce de
// esta visita (Next lo pone solo en los suyos) y los que esos scripts cargan ('strict-dynamic'): un script inyectado
// por un atacante en el HTML no lo tiene y el navegador no lo ejecuta.
// Los estilos no se limitan: la app usa estilos en línea en muchos lugares.
export const BASE_CSP = "object-src 'none'; base-uri 'self'; form-action 'self'"

export function newNonce(): string {
  return btoa(crypto.randomUUID())
}

export function appCsp(nonce: string, isDev = process.env.NODE_ENV === 'development'): string {
  // En desarrollo React usa eval para mostrar mejor los errores; en producción no hace falta
  const script = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`
  return `${script}; ${BASE_CSP}`
}

// Archivos HTML estáticos de public/ (la masterclass): llevan su propio script en línea y no pasan por React, así que
// no pueden llevar nonce. Se quedan con la política base.
export function usesNonce(pathname: string): boolean {
  return !pathname.endsWith('.html') && !pathname.startsWith('/api')
}
