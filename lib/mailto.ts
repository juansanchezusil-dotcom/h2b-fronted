// Enlace mailto: con el destinatario codificado. El correo puede venir de datos de ofertas: sin codificar, un valor
// como "a@b.com?bcc=otro@c.com" agregaría destinatarios o cambiaría el texto del mensaje.
export function mailtoHref(to: string, fields?: { subject: string; body: string }): string {
  const address = encodeURIComponent(to.trim()).replace(/%40/g, '@').replace(/%2C/gi, ',')
  if (!fields) return `mailto:${address}`
  return `mailto:${address}?subject=${encodeURIComponent(fields.subject)}&body=${encodeURIComponent(fields.body)}`
}
