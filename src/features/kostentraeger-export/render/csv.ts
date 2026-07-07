import { formatHoursDe } from "../format";
import type { ExportDocument } from "../schemas";

const SEPARATOR = ";";

// Spreadsheet formula injection: a cell beginning with = + - @ (or a tab/CR) is
// executed as a formula by Excel/Sheets. Prefix such values with an apostrophe
// so the recipient's spreadsheet renders them as literal text.
const FORMULA_LEAD = /^[=+\-@\t\r]/;

function escapeCell(value: string): string {
  const safe = FORMULA_LEAD.test(value) ? `'${value}` : value;
  if (safe.includes(SEPARATOR) || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/**
 * Renders the Einsatznachweis as CSV. Uses `;` separators, comma decimals and
 * a UTF-8 BOM so Excel (DE locale) opens it correctly. Multiple months are
 * stacked into one file.
 */
export function renderCsv(doc: ExportDocument): Buffer {
  const lines: string[] = [];
  const row = (cells: string[]) =>
    lines.push(cells.map(escapeCell).join(SEPARATOR));

  for (const month of doc.months) {
    row(["Einsatznachweis Schulbegleitung für:", doc.subjectName]);
    row(["Monat / Jahr:", month.label]);
    if (doc.schulbegleiterName) {
      row(["SchulbegleiterIn:", doc.schulbegleiterName]);
    }
    lines.push("");
    row(["Tag", "Datum", "Uhrzeit", "Std.", "SchulbegleiterIn", "Bemerkungen"]);
    for (const day of month.days) {
      row([
        day.weekday,
        day.dateLabel,
        day.uhrzeit,
        day.hours > 0 ? formatHoursDe(day.hours) : "",
        day.schulbegleiter,
        day.bemerkungen,
      ]);
    }
    row([
      "",
      "",
      "Indirekte Leistung",
      month.indirectHours > 0 ? formatHoursDe(month.indirectHours) : "",
      "",
      "",
    ]);
    row(["", "", "Gesamt:", formatHoursDe(month.totalHours), "", ""]);
    lines.push("");
  }

  return Buffer.from(`﻿${lines.join("\r\n")}`, "utf-8");
}
