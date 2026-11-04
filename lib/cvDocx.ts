// Genera el CV y la carta en Word (.docx) en el navegador, siguiendo los modelos oficiales de Juan Te Avisa
// (CV-Modelo-H2B y Cover-Letter-Modelo-H2B): Calibri, azul de marca, nombre centrado en el CV y banda
// beige con filete dorado en la carta. Secciones del CV: Profile, Key Skills, Professional Experience,
// Education, Languages y Availability.
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

// Datos de contacto que la carta muestra en su banda superior
export interface LetterContact {
  targetRole?: string;
  phone?: string;
  email?: string;
  city?: string;
}

const FONT = 'Calibri';
const NAVY = '0B1730';
const BLUE = '1F4E9C';
const GREY = '6B6F7A';
const GOLD = 'C89B3C';
const BEIGE = 'EFE7D8';
const RULE = 'B9BEC9';

// Márgenes del modelo de CV (en twips)
const CV_MARGIN_X = 1020;
const CV_CONTENT_WIDTH = 12240 - CV_MARGIN_X * 2;
// Márgenes del cuerpo de la carta
const LETTER_MARGIN_X = 1247;
const LETTER_CONTENT_WIDTH = 12240 - LETTER_MARGIN_X * 2;

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
  const {
    AlignmentType, BorderStyle, Document, LevelFormat, Packer, Paragraph, Table, TableCell, TableRow,
    TableBorders, TableLayoutType, TabStopType, TextRun, WidthType,
  } = await import('docx');

  const run = (text: string, opts: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}) =>
    new TextRun({ text, font: FONT, size: opts.size ?? 21, bold: opts.bold ?? false, italics: opts.italics ?? false, color: opts.color ?? NAVY });

  const sectionTitle = (title: string) =>
    new Paragraph({
      spacing: { before: 140, after: 60, line: 259 },
      keepNext: true,
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 1 } },
      children: [run(title, { bold: true, size: 22, color: BLUE })],
    });

  const body = (text: string) => new Paragraph({ spacing: { after: 40, line: 259 }, children: [run(text)] });

  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];

  // Encabezado
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0, line: 259 },
      children: [run((cv.header.fullName || 'YOUR NAME').toUpperCase(), { bold: true, size: 44 })],
    })
  );
  if (cv.headline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20, line: 259 },
        children: [run(cv.headline, { bold: true, size: 23, color: BLUE })],
      })
    );
  }
  const contact = [cv.header.city, cv.header.phone, cv.header.email].filter(Boolean).join('  •  ');
  if (contact) {
    children.push(
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40, line: 259 }, children: [run(contact, { size: 20, color: GREY })] })
    );
  }

  if (cv.summary) {
    children.push(sectionTitle('PROFILE'), body(cv.summary));
  }

  if (cv.skills.length) {
    // Habilidades en tres columnas, como en el modelo
    const cols = 3;
    const colWidth = Math.floor(CV_CONTENT_WIDTH / cols);
    const rows: InstanceType<typeof TableRow>[] = [];
    for (let i = 0; i < cv.skills.length; i += cols) {
      const slice = cv.skills.slice(i, i + cols);
      rows.push(
        new TableRow({
          cantSplit: true,
          children: Array.from({ length: cols }, (_, k) =>
            new TableCell({
              width: { size: colWidth, type: WidthType.DXA },
              borders: TableBorders.NONE,
              children: [new Paragraph({ spacing: { after: 20 }, children: slice[k] ? [run(`•  ${slice[k]}`)] : [] })],
            })
          ),
        })
      );
    }
    children.push(
      sectionTitle('KEY SKILLS'),
      new Table({
        width: { size: colWidth * cols, type: WidthType.DXA },
        columnWidths: Array(cols).fill(colWidth),
        layout: TableLayoutType.FIXED,
        borders: TableBorders.NONE,
        rows,
      })
    );
  }

  const experiences = cv.experiences.filter((e) => e.heading && (e.bullets.length > 0 || e.dates));
  if (experiences.length) {
    children.push(sectionTitle(cv.sectionTitle));
    experiences.forEach((e) => {
      const left = [e.heading, e.location].filter(Boolean).join(' | ');
      children.push(
        new Paragraph({
          spacing: { before: 140, after: 0 },
          keepNext: true,
          tabStops: [{ type: TabStopType.RIGHT, position: CV_CONTENT_WIDTH }],
          children: [run(left, { bold: true }), ...(e.dates ? [run('\t'), run(e.dates, { size: 20, color: GREY })] : [])],
        })
      );
      if (e.subtitle) {
        children.push(
          new Paragraph({ spacing: { after: 20, line: 259 }, keepNext: true, children: [run(e.subtitle, { italics: true, color: BLUE })] })
        );
      }
      for (const b of e.bullets) {
        children.push(
          new Paragraph({
            numbering: { reference: 'cv-bullets', level: 0 },
            spacing: { after: 30, line: 254 },
            children: [run(b.text)],
          })
        );
      }
    });
  }

  const education = [...cv.education, ...cv.certifications];
  if (education.length) {
    children.push(sectionTitle(cv.certifications.length ? 'EDUCATION & CERTIFICATIONS' : 'EDUCATION'), ...education.map(body));
  }

  if (cv.languages.length) {
    children.push(sectionTitle('LANGUAGES'), body(cv.languages.join('   •   ')));
  }

  if (cv.availability) {
    children.push(sectionTitle('AVAILABILITY'), body(cv.availability));
  }

  const doc = new Document({
    creator: 'Juan Te Avisa',
    title: `${cv.header.fullName || 'Candidate'} - CV`,
    styles: { default: { document: { run: { font: FONT, size: 21, color: NAVY } } } },
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
              style: { paragraph: { indent: { left: 312, hanging: 227 } } },
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
            margin: { top: 850, bottom: 794, left: CV_MARGIN_X, right: CV_MARGIN_X },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

// Separa la carta en saludo, párrafos, despedida y firma. La carta llega como
// "Dear Hiring Manager,\n\n<párrafos>\n\nSincerely,\nNombre".
export function splitLetter(letter: string, fullName: string) {
  const blocks = letter
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  let greeting = '';
  if (blocks.length && /^dear\b/i.test(blocks[0]) && !blocks[0].includes('\n')) greeting = blocks.shift() as string;

  let closing = '';
  let signature = '';
  const last = blocks[blocks.length - 1];
  if (last && /^(sincerely|kind regards|best regards|regards|respectfully|yours|thank you)\b/i.test(last)) {
    const [first, ...rest] = last.split('\n');
    closing = first.trim();
    signature = rest.join(' ').trim() || fullName;
    blocks.pop();
  }

  return { greeting, paragraphs: blocks, closing, signature };
}

export async function buildLetterDocx(letter: string, fullName: string, contact: LetterContact = {}): Promise<Blob> {
  const {
    BorderStyle, Document, Packer, Paragraph, SectionType, ShadingType, Table, TableBorders, TableCell, TableLayoutType, TableRow, TextRun, WidthType,
  } = await import('docx');

  const run = (text: string, opts: { bold?: boolean; size?: number; color?: string; font?: string; spacing?: number } = {}) =>
    new TextRun({
      text,
      font: opts.font ?? FONT,
      size: opts.size ?? 21,
      bold: opts.bold ?? false,
      color: opts.color ?? NAVY,
      characterSpacing: opts.spacing,
    });

  const line = (children: InstanceType<typeof TextRun>[], after: number, lineSpacing = 269) =>
    new Paragraph({ spacing: { before: 0, after, line: lineSpacing }, children });

  const name = fullName || 'Your Name';
  const { greeting, paragraphs, closing, signature } = splitLetter(letter, name);

  // Banda superior: nombre, puesto y contacto sobre fondo beige con filete dorado
  const bandLines = [
    line([run(name.toUpperCase(), { size: 44, spacing: 140 })], 80),
    ...(contact.targetRole ? [line([run(contact.targetRole.toUpperCase(), { size: 24, color: BLUE, spacing: 40 })], 160)] : []),
    ...[contact.phone, contact.email, contact.city]
      .filter((v): v is string => !!v)
      .map((v) => line([run(v, { size: 20, spacing: 10 })], 0)),
  ];
  const band = new Table({
    width: { size: 12240, type: WidthType.DXA },
    columnWidths: [12240],
    layout: TableLayoutType.FIXED,
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 12240, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.SINGLE, size: 18, color: GOLD },
            },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: BEIGE },
            margins: { top: 520, bottom: 420, left: LETTER_MARGIN_X, right: LETTER_MARGIN_X },
            children: bandLines,
          }),
        ],
      }),
    ],
  });

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Columna izquierda: fecha, filete y referencia al puesto
  const leftChildren = [
    line([run(today)], 360),
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 6, space: 8, color: RULE } },
      spacing: { before: 0, after: 200, line: 269 },
      children: [],
    }),
    ...(contact.targetRole
      ? [line([run('Re:', { bold: true, size: 19, color: GREY })], 0), line([run(contact.targetRole, { size: 20 })], 0)]
      : []),
  ];

  // Columna derecha: saludo, cuerpo, despedida y firma manuscrita
  const rightChildren = [
    ...(greeting ? [line([run(greeting)], 160, 288)] : []),
    ...paragraphs.map((p) =>
      line(
        p.split('\n').map((l, i) => new TextRun({ text: l, font: FONT, size: 21, color: NAVY, break: i === 0 ? 0 : 1 })),
        180,
        300
      )
    ),
    ...(closing ? [line([run(closing)], 200)] : []),
    ...(signature ? [line([run(signature, { font: 'Segoe Script', size: 48 })], 0, 240)] : []),
  ];

  const leftWidth = 3300;
  const rightWidth = LETTER_CONTENT_WIDTH - leftWidth;
  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };
  const bodyTable = new Table({
    width: { size: LETTER_CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [leftWidth, rightWidth],
    layout: TableLayoutType.FIXED,
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: leftWidth, type: WidthType.DXA },
            borders: noBorders,
            margins: { top: 0, bottom: 0, left: 0, right: 300 },
            children: leftChildren,
          }),
          new TableCell({
            width: { size: rightWidth, type: WidthType.DXA },
            borders: noBorders,
            margins: { top: 0, bottom: 0, left: 200, right: 0 },
            children: rightChildren,
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    creator: 'Juan Te Avisa',
    title: `${name} - Cover Letter`,
    styles: { default: { document: { run: { font: FONT, size: 21, color: NAVY } } } },
    sections: [
      // La banda ocupa todo el ancho de la página, por eso va en su propia sección sin márgenes laterales
      {
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 340, bottom: 794, left: 0, right: 0 } } },
        children: [band, new Paragraph({ spacing: { after: 160 }, children: [] })],
      },
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: { size: { width: 12240, height: 15840 }, margin: { top: 340, bottom: 794, left: LETTER_MARGIN_X, right: LETTER_MARGIN_X } },
        },
        children: [bodyTable],
      },
    ],
  });

  return Packer.toBlob(doc);
}
