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

// Times are NOT supplied by the client for WORK entries (COD-48): a
// Schulbegleiter follows the Stundenplan, so start/end are derived
// server-side from the child's Schedule for the entry's weekday.
export const CreateEventSchema = z
  .object({
    type: z.nativeEnum(EventType),
    date: dateStringSchema,
    childIds: z.array(z.string().min(1)).default([]),
    note: z.string().max(2000).optional(),
    signaturePngBase64: signatureSchema,
  })
  .superRefine((val, ctx) => {
    if (val.type === "WORK") {
      if (val.childIds.length < 1)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["childIds"],
          message: "Mindestens ein Kind auswählen.",
        });
    }
    if (val.type === "SICK") {
      if (val.childIds.length !== 0)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["childIds"],
          message: "Bei Krankheit darf kein Kind gewählt werden.",
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
