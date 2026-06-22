import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import { formatHoursDe } from "../format";
import type { ExportDocument, ExportMonth } from "../schemas";

const PAGE_WIDTH = 595.28; // A4 portrait
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const ROW_HEIGHT = 16.5;
const FONT_SIZE = 8;
const HEADER_FONT_SIZE = 8.5;

type Align = "left" | "right";
type Column = { header: string; width: number; align: Align };

/** Six-column layout (sums to the printable A4 width of 515.28pt). */
const COLUMNS: Column[] = [
  { header: "Tag", width: 34, align: "left" },
  { header: "Datum", width: 56, align: "left" },
  { header: "Uhrzeit", width: 92, align: "left" },
  { header: "Std.", width: 44, align: "right" },
  { header: "SchulbegleiterIn", width: 122, align: "left" },
  { header: "Bemerkungen", width: 167.28, align: "left" },
];

/** Seven-column layout when signatures are embedded (also sums to 515.28pt). */
const COLUMNS_WITH_SIGNATURE: Column[] = [
  { header: "Tag", width: 30, align: "left" },
  { header: "Datum", width: 54, align: "left" },
  { header: "Uhrzeit", width: 82, align: "left" },
  { header: "Std.", width: 38, align: "right" },
  { header: "SchulbegleiterIn", width: 104, align: "left" },
  { header: "Bemerkungen", width: 117.28, align: "left" },
  { header: "Unterschrift", width: 90, align: "left" },
];

const BORDER = rgb(0.6, 0.6, 0.6);
const WEEKEND = rgb(0.95, 0.95, 0.95);
const HEADER_BG = rgb(0.85, 0.85, 0.85);
const TEXT = rgb(0.1, 0.1, 0.1);

/** Maps text into the WinAnsi range that pdf-lib's standard fonts support. */
function pdfText(value: string): string {
  return value
    .replace(/[‐-―−]/g, "-")
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .replace(/[^ -~¡-ÿ]/g, "")
    .trim();
}

/** Truncates text with an ellipsis so it fits within `maxWidth`. */
function fit(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (
    truncated.length > 1 &&
    font.widthOfTextAtSize(`${truncated}...`, size) > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}...`;
}

function drawCell(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  text: string,
  font: PDFFont,
  size: number,
  align: Align,
  fill?: ReturnType<typeof rgb>,
): void {
  page.drawRectangle({
    x,
    y,
    width,
    height: ROW_HEIGHT,
    borderColor: BORDER,
    borderWidth: 0.5,
    ...(fill ? { color: fill } : {}),
  });
  const clean = fit(pdfText(text), font, size, width - 8);
  if (!clean) return;
  const textWidth = font.widthOfTextAtSize(clean, size);
  const textX = align === "right" ? x + width - 4 - textWidth : x + 4;
  page.drawText(clean, {
    x: textX,
    y: y + (ROW_HEIGHT - size) / 2 + 1,
    size,
    font,
    color: TEXT,
  });
}

/** Draws a signature image scaled to fit inside the cell box, centred. */
function drawSignature(
  page: PDFPage,
  image: PDFImage,
  x: number,
  y: number,
  cellWidth: number,
): void {
  const scale = Math.min(
    (cellWidth - 6) / image.width,
    (ROW_HEIGHT - 4) / image.height,
    1,
  );
  const width = image.width * scale;
  const height = image.height * scale;
  page.drawImage(image, {
    x: x + (cellWidth - width) / 2,
    y: y + (ROW_HEIGHT - height) / 2,
    width,
    height,
  });
}

function drawMonthPage(
  pdf: PDFDocument,
  doc: ExportDocument,
  month: ExportMonth,
  font: PDFFont,
  bold: PDFFont,
  columns: Column[],
  signatures: Map<string, PDFImage>,
): void {
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - MARGIN;

  page.drawText(pdfText("Einsatznachweis Schulbegleitung"), {
    x: MARGIN,
    y: cursorY - 4,
    size: 13,
    font: bold,
    color: TEXT,
  });
  cursorY -= 24;

  const drawLabelValue = (label: string, value: string) => {
    page.drawText(pdfText(label), {
      x: MARGIN,
      y: cursorY,
      size: 10,
      font: bold,
      color: TEXT,
    });
    const labelWidth = bold.widthOfTextAtSize(pdfText(label), 10);
    page.drawText(pdfText(value), {
      x: MARGIN + labelWidth + 6,
      y: cursorY,
      size: 10,
      font,
      color: TEXT,
    });
    cursorY -= 15;
  };

  drawLabelValue("für:", doc.childName);
  drawLabelValue("Monat / Jahr:", month.label);
  if (doc.schulbegleiterName) {
    drawLabelValue("SchulbegleiterIn:", doc.schulbegleiterName);
  }

  // Table header.
  let rowY = cursorY - 6 - ROW_HEIGHT;
  let x = MARGIN;
  for (const column of columns) {
    drawCell(
      page,
      x,
      rowY,
      column.width,
      column.header,
      bold,
      HEADER_FONT_SIZE,
      column.align,
      HEADER_BG,
    );
    x += column.width;
  }

  const drawRow = (
    cells: string[],
    cellFont: PDFFont,
    fill?: ReturnType<typeof rgb>,
  ) => {
    rowY -= ROW_HEIGHT;
    x = MARGIN;
    columns.forEach((column, index) => {
      drawCell(
        page,
        x,
        rowY,
        column.width,
        cells[index] ?? "",
        cellFont,
        FONT_SIZE,
        column.align,
        fill,
      );
      x += column.width;
    });
  };

  const signatureColumn = columns.length === 7 ? columns[6] : null;
  const signatureX =
    MARGIN + columns.slice(0, 6).reduce((sum, column) => sum + column.width, 0);

  for (const day of month.days) {
    drawRow(
      [
        day.weekday,
        day.dateLabel,
        day.uhrzeit,
        day.hours > 0 ? formatHoursDe(day.hours) : "",
        day.schulbegleiter,
        day.bemerkungen,
        "",
      ],
      font,
      day.isWeekend ? WEEKEND : undefined,
    );
    if (signatureColumn && day.signatureKey) {
      const image = signatures.get(day.signatureKey);
      if (image) {
        drawSignature(page, image, signatureX, rowY, signatureColumn.width);
      }
    }
  }

  drawRow(
    [
      "",
      "",
      "Indirekte Leistung",
      month.indirectHours > 0 ? formatHoursDe(month.indirectHours) : "",
      "",
      "",
      "",
    ],
    font,
  );
  drawRow(
    ["", "", "Gesamt:", formatHoursDe(month.totalHours), "", "", ""],
    bold,
  );

  // Confirmation footer.
  let footerY = rowY - 32;
  page.drawText(pdfText("Die Ausführung der Leistung wird bestätigt:"), {
    x: MARGIN,
    y: footerY,
    size: 9,
    font: bold,
    color: TEXT,
  });
  footerY -= 28;
  page.drawText(pdfText("Unterschrift Leitung:"), {
    x: MARGIN,
    y: footerY,
    size: 9,
    font,
    color: TEXT,
  });
  page.drawLine({
    start: { x: MARGIN + 110, y: footerY - 2 },
    end: { x: MARGIN + 320, y: footerY - 2 },
    thickness: 0.5,
    color: BORDER,
  });
}

/**
 * Renders the Einsatznachweis as a PDF, one page per month. When `signatures`
 * is provided, an extra "Unterschrift" column shows each day's signature.
 */
export async function renderPdf(
  doc: ExportDocument,
  signatures?: Map<string, Buffer>,
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const embedded = new Map<string, PDFImage>();
  if (signatures) {
    for (const [key, bytes] of signatures) {
      try {
        embedded.set(key, await pdf.embedPng(bytes));
      } catch {
        // Skip an unreadable signature rather than failing the whole export.
      }
    }
  }
  const columns = signatures ? COLUMNS_WITH_SIGNATURE : COLUMNS;

  for (const month of doc.months) {
    drawMonthPage(pdf, doc, month, font, bold, columns, embedded);
  }
  return Buffer.from(await pdf.save());
}
