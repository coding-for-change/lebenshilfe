import { formatHoursDe } from "../format";
import type { ExportDocument } from "../schemas";

const SEPARATOR = ";";

function escapeCell(value: string): string {
  if (
    value.includes(SEPARATOR) ||
    value.includes('"') ||
    value.includes("\n")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
    row(["Einsatznachweis Schulbegleitung für:", doc.childName]);
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
    row(["", "", "Indirekte Leistung", "", "", ""]);
    row(["", "", "Gesamt:", formatHoursDe(month.totalHours), "", ""]);
    lines.push("");
  }

  return Buffer.from(`﻿${lines.join("\r\n")}`, "utf-8");
}
