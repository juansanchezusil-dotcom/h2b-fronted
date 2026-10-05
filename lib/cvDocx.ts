// Genera el CV y la carta en Word (.docx) en el navegador, siguiendo la plantilla de Juan Te Avisa:
// nombre centrado, puesto, contacto, y las secciones Professional Summary, Key Skills,
// Professional Experience, Education & Certifications, Languages y Availability.
// La librería se carga solo al descargar, para no pesar en la carga inicial de la app.

export interface CvBullet {
  text: string;
}

export interface CvExperience {
  heading: string;
  subtitle: string;
  location: string;
  dates: string;
  bullets: CvBullet[];
}

export interface BuiltCv {
  header: { fullName: string; city: string; phone: string; email: string };
  headline: string;
  summary: string;
  experiences: CvExperience[];
  skills: string[];
  education: string[];
  certifications: string[];
  languages: string[];
  availability: string;
  sectionTitle: string;
}

const FONT = 'Arial';
const PAGE_MARGIN = 792; // 0.55 pulgada, en twips
const CONTENT_WIDTH = 12240 - PAGE_MARGIN * 2; // carta de EE. UU.

// "Ana Pérez" -> "Ana_Perez_CV.docx"
export function docxFileName(fullName: string, kind: 'CV' | 'Cover_Letter'): string {
  const base = (fullName || 'Candidate')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${base || 'Candidate'}_${kind}.docx`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function buildCvDocx(cv: BuiltCv): Promise<Blob> {
  const { AlignmentType, BorderStyle, Document, LevelFormat, Packer, Paragraph, TabStopType, TextRun } = await import('docx');

  const run = (text: string, opts: { bold?: boolean; italics?: boolean; size?: number } = {}) =>
    new TextRun({ text, font: FONT, size: opts.size ?? 20, bold: opts.bold, italics: opts.italics });

  const sectionTitle = (title: string) =>
    new Paragraph({
      spacing: { before: 160, after: 50 },
      keepNext: true,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
      children: [run(title, { bold: true, size: 21 })],
    });

  const body = (text: string) => new Paragraph({ spacing: { after: 20 }, children: [run(text)] });

  const children: InstanceType<typeof Paragraph>[] = [];

  // Encabezado
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [run((cv.header.fullName || 'YOUR NAME').toUpperCase(), { bold: true, size: 34 })],
    })
  );
  if (cv.headline) {
    children.push(
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [run(cv.headline, { bold: true, size: 21 })] })
    );
  }
  const contact = [cv.header.city, cv.header.phone, cv.header.email].filter(Boolean).join('  |  ');
  if (contact) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [run(contact)] }));
  }

  if (cv.summary) {
    children.push(sectionTitle('PROFESSIONAL SUMMARY'), body(cv.summary));
  }

  if (cv.skills.length) {
    children.push(sectionTitle('KEY SKILLS'), body(cv.skills.join('  •  ')));
  }

  const experiences = cv.experiences.filter((e) => e.heading && (e.bullets.length > 0 || e.dates));
  if (experiences.length) {
    children.push(sectionTitle(cv.sectionTitle));
    experiences.forEach((e, i) => {
      const left = [e.heading, e.location].filter(Boolean).join(' | ');
      children.push(
        new Paragraph({
          spacing: { before: i === 0 ? 40 : 100, after: 0 },
          keepNext: true,
          tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
          children: [run(left, { bold: true }), ...(e.dates ? [run('\t'), run(e.dates, { bold: true })] : [])],
        })
      );
      if (e.subtitle) {
        children.push(new Paragraph({ spacing: { after: 20 }, keepNext: true, children: [run(e.subtitle, { italics: true })] }));
      }
      for (const b of e.bullets) {
        children.push(
          new Paragraph({
            numbering: { reference: 'cv-bullets', level: 0 },
            spacing: { after: 10 },
            children: [run(b.text)],
          })
        );
      }
    });
  }

  const education = [...cv.education, ...cv.certifications];
  if (education.length) {
    children.push(sectionTitle('EDUCATION & CERTIFICATIONS'), ...education.map(body));
  }

  if (cv.languages.length) {
    children.push(sectionTitle('LANGUAGES'), body(cv.languages.join('   |   ')));
  }

  if (cv.availability) {
    children.push(sectionTitle('AVAILABILITY'), body(cv.availability));
  }

  const doc = new Document({
    creator: 'Juan Te Avisa',
    title: `${cv.header.fullName || 'Candidate'} - CV`,
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    numbering: {
      config: [
        {
          reference: 'cv-bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 180 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 720, bottom: 720, left: PAGE_MARGIN, right: PAGE_MARGIN },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function buildLetterDocx(letter: string, fullName: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');

  const paragraphs = letter
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        new Paragraph({
          spacing: { after: 220, line: 276 },
          // Los saltos de línea simples (como en "Sincerely,\nNombre") se respetan
          children: block.split('\n').flatMap((line, i) => [new TextRun({ text: line, font: FONT, size: 22, break: i === 0 ? 0 : 1 })]),
        })
    );

  const doc = new Document({
    creator: 'Juan Te Avisa',
    title: `${fullName || 'Candidate'} - Cover Letter`,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [
      {
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        children: paragraphs,
      },
    ],
  });

  return Packer.toBlob(doc);
}
