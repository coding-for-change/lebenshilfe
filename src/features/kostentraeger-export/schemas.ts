import { z } from "zod";

const MonthMarkerSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  month: z.number().int().min(1).max(12),
});

const monthIndex = (marker: { year: number; month: number }) =>
  marker.year * 12 + (marker.month - 1);

export const ExportRequestSchema = z
  .object({
    childId: z.string().min(1, "Kein Kind ausgewählt."),
    format: z.enum(["pdf", "xlsx", "csv"]),
    scope: z.enum(["combined", "per-assistant"]),
    from: MonthMarkerSchema,
    to: MonthMarkerSchema,
  })
  .superRefine((value, ctx) => {
    const span = monthIndex(value.to) - monthIndex(value.from);
    if (span < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "Der End-Monat liegt vor dem Start-Monat.",
      });
    } else if (span > 23) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "Es können höchstens 24 Monate auf einmal exportiert werden.",
      });
    }

    const now = new Date();
    const currentMonthIndex = now.getFullYear() * 12 + now.getMonth();
    if (monthIndex(value.to) > currentMonthIndex) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "Der Zeitraum darf nicht in der Zukunft liegen.",
      });
    }
  });

export type ExportRequest = z.infer<typeof ExportRequestSchema>;
export type ExportFormat = ExportRequest["format"];
export type ExportScope = ExportRequest["scope"];

/** Labels for the format select in the export dialog. */
export const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "csv", label: "CSV" },
];

/** Labels for the scope select in the export dialog. */
export const SCOPE_OPTIONS: { value: ExportScope; label: string }[] = [
  { value: "combined", label: "Zusammengefasst (alle Schulbegleiter)" },
  { value: "per-assistant", label: "Pro Schulbegleiter (eine Datei je SB)" },
];

/** A single calendar-day row of the Einsatznachweis table. */
export type ExportDay = {
  iso: string;
  dateLabel: string;
  weekday: string;
  isWeekend: boolean;
  /** Joined time ranges for the day, e.g. "08:00 - 14:00". Empty if no entry. */
  uhrzeit: string;
  hours: number;
  schulbegleiter: string;
  bemerkungen: string;
};

/** One month sheet of the Einsatznachweis. */
export type ExportMonth = {
  year: number;
  month: number;
  /** "Mrz 26" */
  label: string;
  days: ExportDay[];
  /** Billed direct service hours in the month. */
  directHours: number;
  /**
   * Indirect service hours. Always 0 for now — the system has no representation
   * of indirekte Leistung yet. Phase 2 will populate this and the export keeps
   * a dedicated row for it.
   */
  indirectHours: number;
  totalHours: number;
};

/**
 * A complete Einsatznachweis document for one child. For `per-assistant`
 * scope, one document is produced per Schulbegleiter.
 */
export type ExportDocument = {
  childName: string;
  /** Set for `per-assistant` documents, `null` for the combined document. */
  schulbegleiterName: string | null;
  months: ExportMonth[];
};

/** A rendered, downloadable export file. */
export type ExportFile = {
  filename: string;
  mimeType: string;
  base64: string;
};
