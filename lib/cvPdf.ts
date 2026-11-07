// Genera el CV y la carta en PDF en el navegador, con la misma estructura que el Word: nombre centrado,
// puesto, contacto y las secciones Professional Summary, Key Skills, Experience, Education &
// Certifications, Languages y Availability. El texto del PDF es seleccionable (lo leen los sistemas ATS).
// La librería se carga solo al descargar, para no pesar en la carga inicial de la app.

import { splitLetter, type BuiltCv, type LetterContact } from './cvDocx'

const PAGE_W = 612 // carta de EE. UU., en puntos
const PAGE_H = 792

// Colores de los modelos de Juan Te Avisa
type Rgb = [number, number, number]
const NAVY: Rgb = [11, 23, 48]
const BLUE: Rgb = [31, 78, 156]
const GREY: Rgb = [107, 111, 122]
const GOLD: Rgb = [200, 155, 60]
const BEIGE: Rgb = [239, 231, 216]
const RULE: Rgb = [185, 190, 201]

// "Ana_Perez_CV.docx" -> "Ana_Perez_CV.pdf"
export function pdfFileName(docxName: string): string {
  return docxName.replace(/\.docx$/i, '.pdf')
}

type Doc = InstanceType<typeof import('jspdf').jsPDF>

// Las fuentes estándar del PDF solo dibujan Latin-1 (acentos y ñ sí). Lo demás se reemplaza por su
// equivalente simple para que no desaparezca ni salga como un cuadro.
function clean(text: string): string {
  return text
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/\u2022/g, '·')
    .replace(/\u2026/g, '...')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .split('')
    .map((ch) => {
      if (ch.charCodeAt(0) <= 255) return ch
      const base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return base.charCodeAt(0) <= 255 ? base : '?'
    })
    .join('')
}

// Pequeño cursor de escritura: lleva la posición vertical y salta de página cuando hace falta
function cursor(doc: Doc, margin: { left: number; right: number; top: number; bottom: number }) {
  let y = margin.top
  const width = PAGE_W - margin.left - margin.right
  const ensure = (height: number) => {
    if (y + height > PAGE_H - margin.bottom) {
      doc.addPage()
      y = margin.top
    }
  }
  const font = (style: 'normal' | 'bold' | 'italic', size: number) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }
  return {
    get y() {
      return y
    },
    width,
    margin,
    ensure,
    font,
    gap: (n: number) => {
      y += n
    },
    // Texto en una o varias líneas; devuelve nada, avanza y
    paragraph(text: string, opts: { size?: number; style?: 'normal' | 'bold' | 'italic'; align?: 'left' | 'center'; indent?: number; leading?: number; after?: number; bullet?: boolean; color?: Rgb } = {}) {
      const size = opts.size ?? 10
      const leading = size * (opts.leading ?? 1.32)
      font(opts.style ?? 'normal', size)
      doc.setTextColor(...(opts.color ?? NAVY))
      doc.setFillColor(...(opts.color ?? NAVY))
      const indent = opts.indent ?? 0
      const lines: string[] = doc.splitTextToSize(clean(text), width - indent)
      let first = true
      for (const line of lines) {
        ensure(leading)
        y += leading
        if (opts.bullet && first) doc.circle(margin.left + 5, y - size * 0.55, 1.3, 'F')
        first = false
        if (opts.align === 'center') doc.text(line, margin.left + width / 2, y - size * 0.25, { align: 'center' })
        else doc.text(line, margin.left + indent, y - size * 0.25)
      }
      y += opts.after ?? 0
    },
  }
}

export async function buildCvPdf(cv: BuiltCv): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  doc.setProperties({ title: `${cv.header.fullName || 'Candidate'} - CV`, creator: 'Juan Te Avisa' })
  const c = cursor(doc, { left: 40, right: 40, top: 34, bottom: 34 })

  const section = (title: string, keepWith = 0) => {
    c.ensure(44 + keepWith)
    c.gap(14)
    c.font('bold', 11)
    c.paragraph(title, { size: 11, style: 'bold', color: BLUE })
    doc.setLineWidth(0.8)
    doc.setDrawColor(...BLUE)
    doc.line(c.margin.left, c.y + 1, c.margin.left + c.width, c.y + 1)
    c.gap(7)
  }

  // Encabezado
  c.paragraph((cv.header.fullName || 'YOUR NAME').toUpperCase(), { size: 22, style: 'bold', align: 'center', after: 1 })
  if (cv.headline) c.paragraph(cv.headline, { size: 11.5, style: 'bold', align: 'center', after: 1, color: BLUE })
  const contact = [cv.header.city, cv.header.phone, cv.header.email].filter(Boolean).join('  \u2022  ')
  if (contact) c.paragraph(contact, { size: 10, align: 'center', after: 1, color: GREY })

  if (cv.summary) {
    section('PROFILE')
    c.paragraph(cv.summary)
  }

  if (cv.skills.length) {
    section('KEY SKILLS')
    // Tres columnas con viñeta, igual que el Word
    const cols = 3
    const colW = c.width / cols
    c.font('normal', 10)
    doc.setTextColor(...NAVY)
    doc.setFillColor(...NAVY)
    for (let i = 0; i < cv.skills.length; i += cols) {
      const row = cv.skills.slice(i, i + cols).map((s) => doc.splitTextToSize(clean(s), colW - 18) as string[])
      const lines = Math.max(...row.map((r) => r.length))
      const leading = 13.2
      c.ensure(lines * leading)
      const top = c.y
      row.forEach((r, k) => {
        const x = c.margin.left + k * colW
        r.forEach((line, j) => {
          const baseline = top + (j + 1) * leading
          if (j === 0) doc.circle(x + 5, baseline - 10 * 0.55 - 2.5, 1.3, 'F')
          doc.text(line, x + 14, baseline - 2.5)
        })
      })
      c.gap(lines * leading + 1.5)
    }
  }

  const experiences = cv.experiences.filter((e) => e.heading && (e.bullets.length > 0 || e.dates))
  // Alto que ocupa un trabajo completo (cargo, subtítulo y viñetas): así nunca se parte entre dos páginas
  const experienceHeight = (e: (typeof experiences)[number]) => {
    c.font('bold', 10)
    const dates = clean(e.dates || '')
    const datesWidth = dates ? doc.getTextWidth(dates) + 8 : 0
    const headingLines = doc.splitTextToSize(clean([e.heading, e.location].filter(Boolean).join(' | ')), c.width - datesWidth).length
    let height = headingLines * 12.5
    if (e.subtitle) {
      c.font('italic', 10)
      height += doc.splitTextToSize(clean(e.subtitle), c.width).length * 13.2 + 1.5
    }
    c.font('normal', 10)
    for (const b of e.bullets) height += doc.splitTextToSize(clean(b.text), c.width - 14).length * 13.2 + 1.5
    return height
  }

  if (experiences.length) {
    // El título de la sección viaja con el primer trabajo: no queda solo al final de una página
    section(cv.sectionTitle, experienceHeight(experiences[0]) + 3)
    experiences.forEach((e, i) => {
      const gap = i === 0 ? 3 : 10
      const yBefore = c.y
      c.ensure(experienceHeight(e) + gap)
      if (c.y === yBefore) c.gap(gap)
      const left = clean([e.heading, e.location].filter(Boolean).join(' | '))
      c.font('bold', 10)
      const leading = 12.5
      c.ensure(leading)
      c.gap(leading)
      const dates = clean(e.dates || '')
      const datesWidth = dates ? doc.getTextWidth(dates) + 8 : 0
      const leftLines: string[] = doc.splitTextToSize(left, c.width - datesWidth)
      doc.setTextColor(...NAVY)
      doc.text(leftLines[0] || '', c.margin.left, c.y - 2.5)
      if (dates) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...GREY)
        doc.text(dates, c.margin.left + c.width, c.y - 2.5, { align: 'right' })
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...NAVY)
      }
      for (const extra of leftLines.slice(1)) {
        c.ensure(leading)
        c.gap(leading)
        doc.text(extra, c.margin.left, c.y - 2.5)
      }
      if (e.subtitle) c.paragraph(e.subtitle, { style: 'italic', after: 1.5, color: BLUE })
      for (const b of e.bullets) c.paragraph(b.text, { indent: 14, after: 1.5, bullet: true })
    })
  }

  const education = [...cv.education, ...cv.certifications]
  if (education.length) {
    section(cv.certifications.length ? 'EDUCATION & CERTIFICATIONS' : 'EDUCATION')
    education.forEach((t) => c.paragraph(t, { after: 0.5 }))
  }

  if (cv.languages.length) {
    section('LANGUAGES')
    c.paragraph(cv.languages.join('   \u2022   '))
  }

  if (cv.availability) {
    section('AVAILABILITY')
    c.paragraph(cv.availability)
  }

  return doc.output('blob')
}

export async function buildLetterPdf(letter: string, fullName: string, contact: LetterContact = {}): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const name = fullName || 'Your Name'
  doc.setProperties({ title: `${name} - Cover Letter`, creator: 'Juan Te Avisa' })

  // Banda superior beige con filete dorado: nombre, puesto y contacto
  const info = [contact.phone, contact.email, contact.city].filter((v): v is string => !!v)
  const bandH = 40 + 26 + (contact.targetRole ? 22 : 0) + info.length * 13 + 22
  doc.setFillColor(...BEIGE)
  doc.rect(0, 0, PAGE_W, bandH, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, bandH, PAGE_W, 2, 'F')
  const left = 62
  let y = 40 + 22
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(22)
  doc.setTextColor(...NAVY)
  doc.text(clean(name.toUpperCase()), left, y, { charSpace: 2 })
  if (contact.targetRole) {
    y += 22
    doc.setFontSize(12)
    doc.setTextColor(...BLUE)
    doc.text(clean(contact.targetRole.toUpperCase()), left, y, { charSpace: 1 })
  }
  doc.setFontSize(10)
  doc.setTextColor(...NAVY)
  for (const v of info) {
    y += 13
    doc.text(clean(v), left, y)
  }

  // Columna izquierda: fecha, filete y referencia al puesto
  const top = bandH + 38
  const colW = 165
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.setFontSize(10.5)
  doc.text(today, left, top)
  doc.setDrawColor(...RULE)
  doc.setLineWidth(0.6)
  doc.line(left, top + 14, left + colW - 15, top + 14)
  if (contact.targetRole) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...GREY)
    doc.text('Re:', left, top + 36)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...NAVY)
    const re: string[] = doc.splitTextToSize(clean(contact.targetRole), colW - 20)
    re.forEach((l, i) => doc.text(l, left, top + 49 + i * 13))
  }

  // Columna derecha: saludo, cuerpo, despedida y firma
  const c = cursor(doc, { left: left + colW + 10, right: left, top, bottom: 50 })
  const { greeting, paragraphs, closing, signature } = splitLetter(letter, name)
  c.gap(-14)
  if (greeting) c.paragraph(greeting, { size: 10.5, leading: 1.45, after: 8 })
  for (const p of paragraphs) {
    const lines = p.split('\n')
    lines.forEach((l, i) => c.paragraph(l, { size: 10.5, leading: 1.5, after: i === lines.length - 1 ? 9 : 0 }))
  }
  if (closing) c.paragraph(closing, { size: 10.5, leading: 1.45, after: 10 })
  if (signature) c.paragraph(signature, { size: 22, style: 'italic', leading: 1.2 })

  return doc.output('blob')
}
