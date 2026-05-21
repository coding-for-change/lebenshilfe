import { Workbook } from "exceljs";
import type { Borders, Fill, Worksheet } from "exceljs";
import type { ExportDocument, ExportMonth } from "../schemas";

const HEADER_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD9D9D9" },
};
const WEEKEND_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF2F2F2" },
};
const THIN_BORDER: Partial<Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

/** Excel sheet names: max 31 chars, no `[]:*?/\`, and must be unique. */
function uniqueSheetName(used: Set<string>, label: string): string {
  const base =
    label
      .replace(/[[\]:*?/\\]/g, " ")
      .trim()
      .slice(0, 28) || "Monat";
  let name = base;
  let suffix = 2;
  while (used.has(name)) {
    name = `${base} ${suffix}`;
    suffix += 1;
  }
  used.add(name);
  return name;
}

function writeMonthSheet(
  worksheet: Worksheet,
  doc: ExportDocument,
  month: ExportMonth,
): void {
  worksheet.columns = [
    { width: 6 },
    { width: 12 },
    { width: 20 },
    { width: 9 },
    { width: 26 },
    { width: 38 },
  ];

  worksheet.mergeCells("A1:B1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Einsatznachweis Schulbegleitung für:";
  titleCell.font = { bold: true };
  worksheet.mergeCells("C1:F1");
  worksheet.getCell("C1").value = doc.childName;

  worksheet.getCell("A2").value = "Monat / Jahr:";
  worksheet.getCell("A2").font = { bold: true };
  worksheet.getCell("C2").value = month.label;

  if (doc.schulbegleiterName) {
    worksheet.getCell("A3").value = "SchulbegleiterIn:";
    worksheet.getCell("A3").font = { bold: true };
    worksheet.getCell("C3").value = doc.schulbegleiterName;
  }

  const headerRowIndex = 5;
  const headers = [
    "Tag",
    "Datum",
    "Uhrzeit",
    "Std.",
    "SchulbegleiterIn",
    "Bemerkungen",
  ];
  const headerRow = worksheet.getRow(headerRowIndex);
  headers.forEach((label, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = label;
    cell.font = { bold: true };
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { horizontal: "center" };
  });

  let rowIndex = headerRowIndex + 1;
  const firstDayRow = rowIndex;
  for (const day of month.days) {
    const row = worksheet.getRow(rowIndex);
    row.getCell(1).value = day.weekday;
    row.getCell(2).value = day.dateLabel;
    row.getCell(3).value = day.uhrzeit;
    const hoursCell = row.getCell(4);
    hoursCell.value = day.hours > 0 ? day.hours : null;
    hoursCell.numFmt = "0.00";
    row.getCell(5).value = day.schulbegleiter;
    row.getCell(6).value = day.bemerkungen;
    for (let column = 1; column <= 6; column += 1) {
      const cell = row.getCell(column);
      cell.border = THIN_BORDER;
      if (day.isWeekend) cell.fill = WEEKEND_FILL;
    }
    rowIndex += 1;
  }
  const lastDayRow = rowIndex - 1;

  const indirectRow = worksheet.getRow(rowIndex);
  indirectRow.getCell(3).value = "Indirekte Leistung";
  for (let column = 1; column <= 6; column += 1) {
    indirectRow.getCell(column).border = THIN_BORDER;
  }
  rowIndex += 1;

  const totalRow = worksheet.getRow(rowIndex);
  totalRow.getCell(3).value = "Gesamt:";
  totalRow.getCell(3).font = { bold: true };
  const totalCell = totalRow.getCell(4);
  totalCell.value = {
    formula: `SUM(D${firstDayRow}:D${lastDayRow})`,
    result: month.totalHours,
  };
  totalCell.numFmt = "0.00";
  totalCell.font = { bold: true };
  for (let column = 1; column <= 6; column += 1) {
    totalRow.getCell(column).border = THIN_BORDER;
  }
  rowIndex += 2;

  const confirmCell = worksheet.getCell(`A${rowIndex}`);
  confirmCell.value = "Die Ausführung der Leistung wird bestätigt:";
  confirmCell.font = { bold: true };
  rowIndex += 2;
  worksheet.getCell(`A${rowIndex}`).value = "Unterschrift Leitung:";
}

/** Renders the Einsatznachweis as an `.xlsx` workbook, one worksheet per month. */
export async function renderXlsx(doc: ExportDocument): Promise<Buffer> {
  const workbook = new Workbook();
  const usedNames = new Set<string>();
  for (const month of doc.months) {
    const worksheet = workbook.addWorksheet(
      uniqueSheetName(usedNames, month.label),
    );
    writeMonthSheet(worksheet, doc, month);
  }
  const written = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(written)
    ? written
    : Buffer.from(written as unknown as ArrayBuffer);
}
