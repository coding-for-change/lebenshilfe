import { z } from "zod";
import { EventType } from "@/generated/prisma";

const timeStringSchema = z.string().regex(/^\d{2}:\d{2}$/, "Ungültige Zeit.");

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum.");

const signatureSchema = z
  .string()
  .min(100, "Unterschrift fehlt.")
  .refine(
    (v) => v.startsWith("data:image/") || /^[A-Za-z0-9+/=\n\r]+$/.test(v),
    "Ungültige Signatur.",
  );

function isWeekend(dateString: string) {
  const d = new Date(`${dateString}T00:00:00`);
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

export const CreateEventSchema = z
  .object({
    type: z.nativeEnum(EventType),
    date: dateStringSchema,
    childIds: z.array(z.string().min(1)).default([]),
    startTime: timeStringSchema.optional(),
    endTime: timeStringSchema.optional(),
    note: z.string().max(2000).optional(),
    signaturePngBase64: signatureSchema,
  })
  .superRefine((val, ctx) => {
    const requireTimes = () => {
      if (!val.startTime)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startTime"],
          message: "Startzeit fehlt.",
        });
      if (!val.endTime)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "Endzeit fehlt.",
        });
      if (val.startTime && val.endTime && !(val.endTime > val.startTime))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "Ende muss nach Start liegen.",
        });
    };

    if (val.type === "WORK") {
      if (val.childIds.length < 1)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["childIds"],
          message: "Mindestens ein Kind auswählen.",
        });
      if (isWeekend(val.date))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["date"],
          message: "Reguläre Arbeit ist nur an Werktagen möglich.",
        });
      requireTimes();
    }

    if (val.type === "INDIRECT") {
      if (val.childIds.length !== 1)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["childIds"],
          message: "Für eine indirekte Leistung genau ein Kind auswählen.",
        });
      if (!val.note || val.note.trim().length < 1)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["note"],
          message: "Notiz ist Pflicht (mind. 1 Zeichen).",
        });
      requireTimes();
    }

    if (val.type === "SICK") {
      if (val.childIds.length !== 0)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["childIds"],
          message: "Bei Krankheit darf kein Kind gewählt werden.",
        });
      if (val.startTime || val.endTime)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startTime"],
          message: "Krankheit ist ganztägig.",
        });
    }
  });

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = z
  .object({
    startTime: timeStringSchema.optional(),
    endTime: timeStringSchema.optional(),
    note: z.string().max(2000).nullable().optional(),
  })
  .refine((v) => !v.startTime || !v.endTime || v.endTime > v.startTime, {
    message: "Ende muss nach Start liegen.",
    path: ["endTime"],
  });

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

export const SubmitMonthlyReportSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  month: z.number().int().min(1).max(12),
  supervisorName: z.string().trim().min(1, "Name fehlt.").max(200),
  signaturePngBase64: signatureSchema,
});

export type SubmitMonthlyReportInput = z.infer<
  typeof SubmitMonthlyReportSchema
>;

// A Schulbegleiter confirms admin-created/edited work entries by re-signing
// them. One signature applies to all listed (still-unconfirmed) entries.
export const ConfirmWorkEventsSchema = z.object({
  eventIds: z.array(z.string().min(1)).min(1, "Keine Einträge ausgewählt."),
  signaturePngBase64: signatureSchema,
});

export type ConfirmWorkEventsInput = z.infer<typeof ConfirmWorkEventsSchema>;

// INDIRECT entry created by free-text child name. The SB types the child's
// name (same UX as a Vertretung free-text entry). Server resolves it via
// exact match and rejects if no child is found.
export const CreateIndirectByNameSchema = z
  .object({
    childNameText: z.string().min(2, "Name muss mindestens 2 Zeichen haben."),
    date: dateStringSchema,
    startTime: timeStringSchema,
    endTime: timeStringSchema,
    note: z
      .string()
      .trim()
      .min(1, "Notiz ist Pflicht (mind. 1 Zeichen).")
      .max(2000),
    signaturePngBase64: signatureSchema,
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "Ende muss nach Start liegen.",
    path: ["endTime"],
  });

export type CreateIndirectByNameInput = z.infer<
  typeof CreateIndirectByNameSchema
>;

// Pool work entry: the SB records only when they were active, not for which
// child. No childId; one WORK Event is stored against the SB's pool.
export const CreatePoolWorkEventSchema = z
  .object({
    date: dateStringSchema,
    startTime: timeStringSchema,
    endTime: timeStringSchema,
    note: z.string().max(2000).optional(),
    signaturePngBase64: signatureSchema,
  })
  .superRefine((val, ctx) => {
    if (isWeekend(val.date))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: "Reguläre Arbeit ist nur an Werktagen möglich.",
      });
    if (!(val.endTime > val.startTime))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "Ende muss nach Start liegen.",
      });
  });

export type CreatePoolWorkEventInput = z.infer<
  typeof CreatePoolWorkEventSchema
>;
