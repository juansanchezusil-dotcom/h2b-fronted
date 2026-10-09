// Genera el CV y la carta en PDF en el navegador, con la misma estructura que el Word: nombre centrado,
// puesto, contacto y las secciones Professional Summary, Key Skills, Experience, Education &
// Certifications, Languages y Availability. El texto del PDF es seleccionable (lo leen los sistemas ATS).
// La librería se carga solo al descargar, para no pesar en la carga inicial de la app.

import type { BuiltCv } from './cvDocx'

const PAGE_W = 612 // carta de EE. UU., en puntos
const PAGE_H = 792

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
    paragraph(text: string, opts: { size?: number; style?: 'normal' | 'bold' | 'italic'; align?: 'left' | 'center'; indent?: number; leading?: number; after?: number; bullet?: boolean } = {}) {
      const size = opts.size ?? 10
      const leading = size * (opts.leading ?? 1.25)
      font(opts.style ?? 'normal', size)
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

  const section = (title: string) => {
    c.ensure(34)
    c.gap(8)
    c.font('bold', 10.5)
    c.paragraph(title, { size: 10.5, style: 'bold' })
    doc.setLineWidth(0.6)
    doc.line(c.margin.left, c.y + 1, c.margin.left + c.width, c.y + 1)
    c.gap(4)
  }

  // Encabezado
  c.paragraph((cv.header.fullName || 'YOUR NAME').toUpperCase(), { size: 17, style: 'bold', align: 'center', after: 1 })
  if (cv.headline) c.paragraph(cv.headline, { size: 10.5, style: 'bold', align: 'center', after: 1 })
  const contact = [cv.header.city, cv.header.phone, cv.header.email].filter(Boolean).join('  |  ')
  if (contact) c.paragraph(contact, { size: 10, align: 'center', after: 1 })

  if (cv.summary) {
    section('PROFESSIONAL SUMMARY')
    c.paragraph(cv.summary)
  }

  if (cv.skills.length) {
    section('KEY SKILLS')
    c.paragraph(cv.skills.join('  ·  '))
  }

  const experiences = cv.experiences.filter((e) => e.heading && (e.bullets.length > 0 || e.dates))
  if (experiences.length) {
    section(cv.sectionTitle)
    experiences.forEach((e, i) => {
      c.ensure(40)
      c.gap(i === 0 ? 2 : 6)
      const left = clean([e.heading, e.location].filter(Boolean).join(' | '))
      c.font('bold', 10)
      const leading = 12.5
      c.ensure(leading)
      c.gap(leading)
      const dates = clean(e.dates || '')
      const datesWidth = dates ? doc.getTextWidth(dates) + 8 : 0
      const leftLines: string[] = doc.splitTextToSize(left, c.width - datesWidth)
      doc.text(leftLines[0] || '', c.margin.left, c.y - 2.5)
      if (dates) doc.text(dates, c.margin.left + c.width, c.y - 2.5, { align: 'right' })
      for (const extra of leftLines.slice(1)) {
        c.ensure(leading)
        c.gap(leading)
        doc.text(extra, c.margin.left, c.y - 2.5)
      }
      if (e.subtitle) c.paragraph(e.subtitle, { style: 'italic' })
      for (const b of e.bullets) c.paragraph(b.text, { indent: 14, after: 0.5, bullet: true })
    })
  }

  const education = [...cv.education, ...cv.certifications]
  if (education.length) {
    section('EDUCATION & CERTIFICATIONS')
    education.forEach((t) => c.paragraph(t, { after: 0.5 }))
  }

  if (cv.languages.length) {
    section('LANGUAGES')
    c.paragraph(cv.languages.join('   |   '))
  }

  if (cv.availability) {
    section('AVAILABILITY')
    c.paragraph(cv.availability)
  }

  return doc.output('blob')
}

export async function buildLetterPdf(letter: string, fullName: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  doc.setProperties({ title: `${fullName || 'Candidate'} - Cover Letter`, creator: 'Juan Te Avisa' })
  const c = cursor(doc, { left: 72, right: 72, top: 60, bottom: 60 })

  for (const block of letter.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)) {
    // Los saltos de línea simples (como en "Sincerely,\nNombre") se respetan
    const lines = block.split('\n')
    lines.forEach((line, i) => c.paragraph(line, { size: 11, leading: 1.4, after: i === lines.length - 1 ? 10 : 0 }))
  }

  return doc.output('blob')
}
