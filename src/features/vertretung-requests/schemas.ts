import { z } from "zod";

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

/**
 * A Schulbegleiter reporting a Vertretung for a child they are NOT assigned to.
 * The child is free text (`childNameText`) — the roster is never shown to them.
 * Times are entered manually (no Stundenplan link to a foreign child).
 */
export const SubmitVertretungRequestSchema = z
  .object({
    childNameText: z
      .string()
      .trim()
      .min(2, "Bitte den Namen des Kindes eingeben.")
      .max(200),
    date: dateStringSchema,
    startTime: timeStringSchema,
    endTime: timeStringSchema,
    note: z.string().max(2000).optional(),
    signaturePngBase64: signatureSchema,
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "Ende muss nach Start liegen.",
    path: ["endTime"],
  });

export type SubmitVertretungRequestInput = z.infer<
  typeof SubmitVertretungRequestSchema
>;

/** Admin confirms a pending request by assigning the correct child. */
export const ResolveVertretungRequestSchema = z.object({
  requestId: z.string().min(1),
  childId: z.string().min(1, "Bitte ein Kind auswählen."),
});

export type ResolveVertretungRequestInput = z.infer<
  typeof ResolveVertretungRequestSchema
>;

/** Admin rejects a pending request (e.g. not a real child, duplicate). */
export const RejectVertretungRequestSchema = z.object({
  requestId: z.string().min(1),
  reason: z.string().trim().max(2000).optional(),
});

export type RejectVertretungRequestInput = z.infer<
  typeof RejectVertretungRequestSchema
>;

/** Data the facade persists when creating a request (server-derived match). */
export type CreateVertretungRequestData = {
  reportedByUserId: string;
  childNameText: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
  signaturePngBase64: string;
  suggestedChildId: string | null;
  matchScore: number | null;
};
