// Prepara un archivo que la persona adjunta en el asistente de CV. PDF y fotos viajan tal cual (los lee el
// modelo). Word (.docx) no lo lee el modelo, así que se extrae su texto aquí, en el navegador.

export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024
export const ATTACH_ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain'

const IMAGE_OR_PDF = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export type Attachment =
  | { kind: 'doc'; name: string; base64: string; mediaType: string }
  | { kind: 'text'; name: string; text: string }

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsDataURL(file)
  })
}

async function docxText(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const xml = await zip.file('word/document.xml')?.async('string')
  if (!xml) throw new Error('No se pudo leer ese archivo de Word.')
  return xml
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function prepareAttachment(file: File): Promise<Attachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error('El archivo pesa más de 3 MB. Sube uno más liviano o pega el texto.')
  const lower = file.name.toLowerCase()

  if (IMAGE_OR_PDF.includes(file.type)) {
    return { kind: 'doc', name: file.name, base64: await readAsBase64(file), mediaType: file.type }
  }
  if (file.type === DOCX_TYPE || lower.endsWith('.docx')) {
    const text = await docxText(file)
    if (text.length < 20) throw new Error('No encontramos texto en ese archivo de Word.')
    return { kind: 'text', name: file.name, text: text.slice(0, 12000) }
  }
  if (file.type === 'text/plain' || lower.endsWith('.txt')) {
    const text = (await file.text()).trim()
    if (text.length < 20) throw new Error('El archivo de texto está vacío.')
    return { kind: 'text', name: file.name, text: text.slice(0, 12000) }
  }
  if (lower.endsWith('.doc')) throw new Error('Los archivos .doc antiguos no se pueden leer. Guárdalo como .docx o PDF.')
  throw new Error('Sube un PDF, una foto (JPG, PNG o WebP) o un archivo de Word (.docx).')
}
